import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsAppTemplates } from '../../../utils/whatsapp-templates';
import { MedicalRecordStatusEnum } from '../../../utils/enum/medical-record.enum';
import { MedicalRecord } from '@app/modules/medical-record/entities/medical-record.entity';
import { WhatsappService } from '@app/whatsapp/whatsapp.service';

@Injectable()
export class CalendarReminderService {
  private readonly logger = new Logger(CalendarReminderService.name);

  constructor(
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepository: Repository<MedicalRecord>,
    private readonly whatsappService: WhatsappService,
  ) {}

  /**
   * Job que roda a cada 5 minutos para enviar lembretes
   * Envia mensagem 12h antes da consulta
   */
  @Cron('*/5 * * * *') // Executa a cada 5 minutos
  async sendReminderMessages() {
    try {
      const now = new Date();
      // Calcula 12 horas para frente
      const reminderTime = new Date(now.getTime() + 12 * 60 * 60 * 1000);
      // Margem de 5 minutos para não perder nenhuma consulta
      const reminderTimeEnd = new Date(reminderTime.getTime() + 5 * 60 * 1000);

      // Busca consultas que:
      // 1. Não foram canceladas
      // 2. O lembrete ainda não foi enviado
      // 3. Estão programadas para os próximos 12 horas
      const appointments = await this.medicalRecordRepository.find({
        where: {
          status: MedicalRecordStatusEnum.SCHEDULED,
          reminderSentAt: null,
        },
        relations: ['client', 'user'],
      });

      // Filtra apenas as que estão na janela de 12 horas
      const appointmentsToRemind = appointments.filter((apt) => {
        const aptTime = new Date(apt.startDate);
        return aptTime >= now && aptTime <= reminderTimeEnd;
      });

      for (const appointment of appointmentsToRemind) {
        await this.sendReminderMessage(appointment);
      }

      if (appointmentsToRemind.length > 0) {
        this.logger.log(
          `${appointmentsToRemind.length} lembretes enviados com sucesso`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Erro ao enviar lembretes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
    }
  }

  /**
   * Envia mensagem de lembrete para uma consulta específica
   */
  private async sendReminderMessage(appointment: MedicalRecord) {
    try {
      if (!appointment.client?.telephone) {
        this.logger.warn(
          `Telefone não configurado para cliente ${appointment.clientId}`,
        );
        return;
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const confirmationLink = `${frontendUrl}/confirmar-presenca/${appointment.id}/${appointment.confirmationToken}`;

      // Formata a data para exibição
      const appointmentDate = new Date(appointment.startDate).toLocaleString(
        'pt-BR',
        {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        },
      );

      const message = WhatsAppTemplates.confirmationReminder(
        appointment.client.name,
        appointment.user.name,
        appointmentDate,
        confirmationLink,
      );

      // Formata telefone: remove caracteres especiais
      const phone = appointment.client.telephone.replace(/\D/g, '');

      await this.whatsappService.sendMessage({
        to: phone,
        body: message,
      });

      // Marca como enviado
      appointment.reminderSentAt = new Date();
      await this.medicalRecordRepository.save(appointment);

      this.logger.log(
        `Lembrete enviado para ${appointment.client.name} (${phone}) - Consulta ID: ${appointment.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao enviar lembrete para consulta ${appointment.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      // Não lançar erro para não interromper o fluxo de outros lembretes
    }
  }
}
