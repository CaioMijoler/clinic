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
export const WHATSAPP_PROFESSIONAL_CONFIRM_TEMPLATE = 'confirmar_agendamento';
export const WHATSAPP_PROFESSIONAL_CANCEL_TEMPLATE = 'cancelar_agendamento';

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
   * Envia mensagem de confirmação ao paciente logo após o agendamento.
   * Falhas no WhatsApp são apenas logadas — não interrompem o cadastro.
   */
  async sendCreationConfirmation(medicalRecordId: number): Promise<void> {
    try {
      const appointment = await this.medicalRecordRepository.findOne({
        where: { id: medicalRecordId },
        relations: ['client', 'user'],
      });

      if (!appointment) {
        this.logger.warn(
          `Agendamento ${medicalRecordId} não encontrado para envio de confirmação`,
        );
        return;
      }

      if (!appointment.client?.telephone?.trim()) {
        this.logger.warn(
          `Telefone não configurado para cliente ${appointment.clientId} — pulando confirmação do agendamento ${appointment.id}`,
        );
        return;
      }

      if (!appointment.user?.whatsAppToken || !appointment.user?.whatsAppId) {
        this.logger.warn(
          `Credenciais WhatsApp não configuradas para usuário ${appointment.userId} — pulando confirmação do agendamento ${appointment.id}`,
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

      this.logger.log(
        `Confirmação de agendamento enviada para ${appointment.client.name} (${payload.to}) — Consulta #${appointment.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao enviar confirmação de agendamento ${medicalRecordId}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        error instanceof Error ? error.stack : '',
      );
    }
  }

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
          status: MedicalRecordStatusEnum.CREATED,
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

  async notifyProfessionalAppointmentConfirmed(
    medicalRecordId: number,
    userId: number,
  ): Promise<{ success: boolean; message: string }> {
    const appointment = await this.findAppointmentForProfessionalNotification(
      medicalRecordId,
      userId,
    );

    return this.sendProfessionalNotification(
      appointment,
      WHATSAPP_PROFESSIONAL_CONFIRM_TEMPLATE,
      'Confirmação de agendamento enviada ao profissional',
    );
  }

  async notifyProfessionalAppointmentCanceled(
    medicalRecordId: number,
    userId: number,
  ): Promise<{ success: boolean; message: string }> {
    const appointment = await this.findAppointmentForProfessionalNotification(
      medicalRecordId,
      userId,
    );

    return this.sendProfessionalNotification(
      appointment,
      WHATSAPP_PROFESSIONAL_CANCEL_TEMPLATE,
      'Cancelamento de agendamento enviado ao profissional',
    );
  }

  /**
   * Envia notificação ao profissional sem interromper o fluxo principal.
   */
  async sendProfessionalAppointmentCanceledSilently(
    medicalRecordId: number,
  ): Promise<void> {
    await this.trySendProfessionalNotificationSilently(
      medicalRecordId,
      WHATSAPP_PROFESSIONAL_CANCEL_TEMPLATE,
      'Cancelamento de agendamento enviado ao profissional',
    );
  }

  /**
   * Envia notificação de confirmação ao profissional sem interromper o fluxo principal.
   */
  async sendProfessionalAppointmentConfirmedSilently(
    medicalRecordId: number,
  ): Promise<void> {
    await this.trySendProfessionalNotificationSilently(
      medicalRecordId,
      WHATSAPP_PROFESSIONAL_CONFIRM_TEMPLATE,
      'Confirmação de agendamento enviada ao profissional',
    );
  }

  private async trySendProfessionalNotificationSilently(
    medicalRecordId: number,
    templateName: string,
    successMessage: string,
  ): Promise<void> {
    try {
      const appointment = await this.medicalRecordRepository.findOne({
        where: { id: medicalRecordId },
        relations: ['client', 'user'],
      });

      if (!appointment) {
        this.logger.warn(
          `WhatsApp ${templateName}: prontuário ${medicalRecordId} não encontrado — notificação ignorada`,
        );
        return;
      }

      const skipReason = this.getProfessionalNotificationSkipReason(appointment);

      if (skipReason) {
        this.logger.warn(
          `WhatsApp ${templateName}: consulta #${medicalRecordId} — ${skipReason}`,
        );
        return;
      }

      await this.sendProfessionalNotification(
        appointment,
        templateName,
        successMessage,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao enviar WhatsApp ${templateName} para consulta ${medicalRecordId}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        error instanceof Error ? error.stack : '',
      );
    }
  }

  private getProfessionalNotificationSkipReason(
    appointment: MedicalRecord,
  ): string | null {
    if (!appointment.user?.telephone?.trim()) {
      return 'profissional sem telefone cadastrado';
    }

    if (!appointment.user?.whatsAppToken || !appointment.user?.whatsAppId) {
      return 'credenciais WhatsApp não configuradas';
    }

    if (!appointment.client?.name?.trim()) {
      return 'paciente sem nome cadastrado';
    }

    if (!appointment.user?.name?.trim()) {
      return 'profissional sem nome cadastrado';
    }

    return null;
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
    // Template lembrete_agendamento_12h: orienta o paciente a confirmar ou cancelar pelo link ({{4}}).
    const frontendUrl = this.configService.get<string>('frontendUrl');
    const urlSafeToken = Buffer.from(
      appointment.confirmationToken,
      'hex',
    ).toString('base64url');
    const confirmationLink = `${frontendUrl}/confirmar-presenca/${urlSafeToken}`;

    const appointmentTime = this.formatAppointmentDateTime(appointment);

    const phone = this.formatPhoneWithDDI(appointment.client.telephone);

    return {
      to: phone,
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

  private async findAppointmentForProfessionalNotification(
    medicalRecordId: number,
    userId: number,
  ): Promise<MedicalRecord> {
    const appointment = await this.medicalRecordRepository.findOne({
      where: { id: medicalRecordId, userId },
      relations: ['client', 'user'],
    });

    if (!appointment) {
      throw new NotFoundException('Prontuário não encontrado');
    }

    return appointment;
  }

  private async sendProfessionalNotification(
    appointment: MedicalRecord,
    templateName: string,
    successMessage: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!appointment.user?.telephone?.trim()) {
      throw new BadRequestException(
        'Profissional não possui telefone cadastrado para envio de WhatsApp',
      );
    }

    if (!appointment.user?.whatsAppToken || !appointment.user?.whatsAppId) {
      throw new BadRequestException(
        'Credenciais WhatsApp não configuradas para o profissional',
      );
    }

    if (!appointment.client?.name?.trim()) {
      throw new BadRequestException(
        'Paciente não possui nome cadastrado para a notificação',
      );
    }

    if (!appointment.user?.name?.trim()) {
      throw new BadRequestException(
        'Profissional não possui nome cadastrado para a notificação',
      );
    }

    const payload = this.buildProfessionalNotificationPayload(
      appointment,
      templateName,
    );

    await this.whatsappService.sendTemplateMessage(
      {
        whatsappToken: appointment.user.whatsAppToken,
        whatsappId: appointment.user.whatsAppId,
      },
      payload,
    );

    this.logger.log(
      `${successMessage} — ${appointment.user.name} (${payload.to}) — Consulta #${appointment.id}`,
    );

    return {
      success: true,
      message: successMessage,
    };
  }

  private buildProfessionalNotificationPayload(
    appointment: MedicalRecord,
    templateName: string,
  ): SendTemplateMessageDto {
    return {
      to: this.formatPhoneWithDDI(appointment.user.telephone),
      templateName,
      languageCode: 'pt_BR',
      bodyParameters: [
        appointment.user.name,
        appointment.client.name,
        this.formatProfessionalAppointmentDate(appointment),
        this.formatProfessionalAppointmentTimeRange(appointment),
      ],
    };
  }

  private formatProfessionalAppointmentTimeRange(
    appointment: MedicalRecord,
  ): string {
    const startDate = appointment.startDate
      ? new Date(appointment.startDate)
      : new Date(appointment.updatedAt);

    const endDate = appointment.endDate
      ? new Date(appointment.endDate)
      : startDate;

    const startTime = startDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Sao_Paulo',
    });

    const endTime = endDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Sao_Paulo',
    });

    const endTimeCompact = endTime.replace(':', 'h');

    return `${startTime} às ${endTimeCompact}`;
  }

  private formatProfessionalAppointmentDate(appointment: MedicalRecord): string {
    const appointmentDate = appointment.startDate
      ? new Date(appointment.startDate)
      : new Date(appointment.updatedAt);

    return appointmentDate.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      timeZone: 'America/Sao_Paulo',
    });
  }

  private formatAppointmentDateTime(appointment: MedicalRecord): string {
    const appointmentDate = appointment.startDate
      ? new Date(appointment.startDate)
      : new Date(appointment.updatedAt);

    return appointmentDate.toLocaleString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private formatPhoneWithDDI(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return digits.length <= 11 ? `55${digits}` : digits;
  }
}
