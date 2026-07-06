import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Between, IsNull, Repository } from 'typeorm';
import { MedicalRecordStatusEnum } from '../../../utils/enum/medical-record.enum';
import * as crypto from 'crypto';
import { MedicalRecord } from '../../medical-record/entities/medical-record.entity';
import { WhatsappService } from '../../../whatsapp/whatsapp.service';
import { SendTemplateMessageDto } from '../../../whatsapp/dto/send-template-message.dto';
import { v4 as uuidv4 } from 'uuid';

export const WHATSAPP_REMINDER_TEMPLATE = 'lembrete_agendamento_12h';

@Injectable()
export class CalendarReminderService {
  private readonly logger = new Logger(CalendarReminderService.name);

  constructor(
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepository: Repository<MedicalRecord>,
    private readonly whatsappService: WhatsappService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Cron que roda a cada 5 minutos para enviar lembretes de agendamento.
   * Busca consultas com startDate entre 12h ± 5min a partir de agora,
   * com status SCHEDULED e sem lembrete enviado (reminderSentAt = null).
   */
  @Cron('0 0 * * *')
  async sendReminderMessages() {
    try {
      const now = new Date();
      const twelveHoursFromNow = new Date(now.getTime() + 12 * 60 * 60 * 1000);
      const marginMs = 5 * 60 * 1000;

      const appointments = await this.medicalRecordRepository.find({
        where: {
          status: MedicalRecordStatusEnum.SCHEDULED,
          reminderSentAt: IsNull(),
          startDate: Between(
            new Date(twelveHoursFromNow.getTime() - marginMs),
            new Date(twelveHoursFromNow.getTime() + marginMs),
          ),
        },
        relations: ['client', 'user'],
      });

      if (appointments.length === 0) return;

      this.logger.log(
        `Encontrados ${appointments.length} agendamento(s) para enviar lembrete`,
      );

      for (const appointment of appointments) {
        await this.sendReminderMessage(appointment);
      }

      this.logger.log(
        `${appointments.length} lembrete(s) processado(s) com sucesso`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao processar lembretes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        error instanceof Error ? error.stack : '',
      );
    }
  }

  async getReminderPayloadForMedicalRecord(
    medicalRecordId: number,
    userId: number,
  ): Promise<SendTemplateMessageDto> {
    const appointment = await this.medicalRecordRepository.findOne({
      where: { id: medicalRecordId, userId },
      relations: ['client', 'user'],
    });

    if (!appointment) {
      throw new NotFoundException('Prontuário não encontrado');
    }

    if (!appointment.client?.telephone?.trim()) {
      throw new BadRequestException(
        'Paciente não possui telefone cadastrado para envio de WhatsApp',
      );
    }

    await this.ensureConfirmationToken(appointment);

    return this.buildReminderTemplatePayload(appointment);
  }

  /**
   * Envia mensagem de lembrete para uma consulta específica.
   * - Gera token de confirmação caso ainda não exista
   * - Envia via template do WhatsApp Business (obrigatório para mensagens proativas)
   * - Marca reminderSentAt para evitar reenvio
   */
  private async sendReminderMessage(appointment: MedicalRecord) {
    try {
      if (appointment.reminderSentAt) {
        this.logger.warn(
          `Lembrete para consulta ${appointment.id} já foi enviado em ${appointment.reminderSentAt} — pulando`,
        );
        return;
      }

      if (!appointment.client?.telephone) {
        this.logger.warn(
          `Telefone não configurado para cliente ${appointment.clientId} — pulando lembrete para consulta ${appointment.id}`,
        );
        return;
      }

      await this.ensureConfirmationToken(appointment);

      const payload = this.buildReminderTemplatePayload(appointment);

      await this.whatsappService.sendTemplateMessage(
        {
          whatsappToken: appointment.user.whatsAppToken,
          whatsappId: appointment.user.whatsAppId,
        },
        payload,
      );

      await this.medicalRecordRepository.update(appointment.id, {
        reminderSentAt: new Date(),
      });

      this.logger.log(
        `Lembrete enviado para ${appointment.client.name} (${payload.to}) — Consulta #${appointment.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao enviar lembrete para consulta ${appointment.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  private async ensureConfirmationToken(appointment: MedicalRecord): Promise<void> {
    if (appointment.confirmationToken) {
      return;
    }

    const rawUuid = uuidv4();
    const dataToEncrypt = `${appointment.id}@${rawUuid}`;
    const algorithm = this.configService.get<string>('cripto.alg');
    const keyBuffer = new Uint8Array(
      Buffer.from(this.configService.get<string>('cripto.secret') || '', 'hex'),
    );
    const iv = new Uint8Array(
      Buffer.from(this.configService.get<string>('cripto.iv') || '', 'hex'),
    );

    const cipher = crypto.createCipheriv(
      algorithm as any,
      keyBuffer as any,
      iv as any,
    );
    let encrypted = cipher.update(dataToEncrypt, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    appointment.confirmationToken = encrypted;
    await this.medicalRecordRepository.update(appointment.id, {
      confirmationToken: appointment.confirmationToken,
    });
  }

  private buildReminderTemplatePayload(
    appointment: MedicalRecord,
  ): SendTemplateMessageDto {
    const frontendUrl = this.configService.get<string>('frontendUrl');
    const urlSafeToken = Buffer.from(
      appointment.confirmationToken,
      'hex',
    ).toString('base64url');
    const confirmationLink = `${frontendUrl}/confirmar-presenca/${urlSafeToken}`;

    const appointmentDate = appointment.startDate
      ? new Date(appointment.startDate)
      : new Date(appointment.updatedAt);

    const appointmentTime = appointmentDate.toLocaleString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });

    const phone = appointment.client.telephone.replace(/\D/g, '');
    const phoneWithDDI = phone.length <= 11 ? `55${phone}` : phone;

    return {
      to: phoneWithDDI,
      templateName: WHATSAPP_REMINDER_TEMPLATE,
      languageCode: 'pt_BR',
      bodyParameters: [
        appointment.client.name,
        appointment.user.name,
        appointmentTime,
        confirmationLink,
      ],
      buttonParameters: [{ index: 0, text: confirmationLink }],
    };
  }
}
