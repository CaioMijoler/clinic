import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { FilterCalendarDto } from './dto/filter-calendar.dto';
import { DataSource, Repository, Between, FindManyOptions } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { MedicalRecord } from '../medical-record/entities/medical-record.entity';
import { MedicalRecordStatusEnum } from '../../utils/enum/medical-record.enum';
import { AppointmentStatusEnum } from '../../utils/enum/appointment-status.enum';
import { AppointmentCanceledByEnum } from '../../utils/enum/appointment-canceled-by.enum';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Client } from '../clients/entities/client.entity';
import { ResponseMedicalRecordResumeDto } from './dto/response-medical-record-resume.dto';
import * as crypto from 'crypto';
import { NotificationService } from '../notification/notification.service';
import { CalendarReminderService } from './services/calendar-reminder.service';
import { Service } from '../services/entities/service.entity';
import { MedicalRecordService } from '../medical-record/entities/medical-record-service.entity';
import { CreateCalendarServiceItemDto } from './dto/create-calendar.dto';

@Injectable()
export class CalendarService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepository: Repository<MedicalRecord>,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
    private readonly calendarReminderService: CalendarReminderService,
  ) {}

  async create(createCalendarDto: CreateCalendarDto, user: User) {
    try {
      const saved = await this.dataSource.transaction(async (manager) => {
        const userAuth = await manager.findOne(User, {
          where: { id: user.id },
          select: ['id', 'name', 'whatsAppId', 'whatsAppToken'],
        });

        if (!userAuth) {
          throw new NotFoundException(
            'Não conseguimos encontrar o solicitante.',
          );
        }

        const client = await manager.findOne(Client, {
          where: { id: createCalendarDto.clientId },
          select: ['id', 'name'],
        });

        if (!client) {
          throw new NotFoundException(
            'Não conseguimos encontrar o paciente.',
          );
        }

        let medicalRecord: MedicalRecord | null = null;

        if (createCalendarDto.medicalRecordId) {
          medicalRecord = await manager.findOne(MedicalRecord, {
            where: { id: createCalendarDto.medicalRecordId, userId: userAuth.id },
          });

          if (!medicalRecord) {
            throw new NotFoundException(
              'Não conseguimos encontrar o prontuário.',
            );
          }
        }

        if (!createCalendarDto.services?.length) {
          throw new BadRequestException(
            'Informe ao menos um serviço para o agendamento.',
          );
        }

        const serviceIds = [
          ...new Set(createCalendarDto.services.map((item) => item.serviceId)),
        ];
        const services = await manager.find(Service, {
          where: serviceIds.map((id) => ({ id, userId: userAuth.id })),
        });

        if (services.length !== serviceIds.length) {
          throw new NotFoundException(
            'Não conseguimos encontrar um dos serviços selecionados.',
          );
        }

        const serviceById = new Map(services.map((service) => [service.id, service]));

        for (const item of createCalendarDto.services) {
          const service = serviceById.get(item.serviceId);

          if (!service?.active) {
            throw new BadRequestException(
              `O serviço "${service?.name ?? item.serviceId}" está inativo.`,
            );
          }
        }

        const servicesDurationTotal = createCalendarDto.services.reduce(
          (total, item) => total + item.durationMinutes,
          0,
        );

        let durationMinutes =
          createCalendarDto.durationMinutes ?? servicesDurationTotal;

        if (!durationMinutes || durationMinutes < 1) {
          durationMinutes = servicesDurationTotal;
        }

        const startDate = new Date(createCalendarDto.start.dateTime);
        const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

        const conflictingAppointment = await manager
          .createQueryBuilder(Appointment, 'appointment')
          .where('appointment.user_id = :userId', { userId: userAuth.id })
          .andWhere('appointment.status IN (:...statuses)', {
            statuses: [
              AppointmentStatusEnum.CREATED,
              AppointmentStatusEnum.SCHEDULED,
              AppointmentStatusEnum.CONFIRMED_SCHEDULE,
              AppointmentStatusEnum.IN_PROGRESS,
            ],
          })
          .andWhere(
            '(appointment.start_date < :endDate AND appointment.end_date > :startDate)',
            { startDate, endDate },
          )
          .getOne();

        if (conflictingAppointment) {
          throw new BadRequestException(
            'Horário indisponível. Já existe um agendamento neste horário.',
          );
        }

        const title = `${createCalendarDto.summary}`.trim();

        const totalQuantitySessions = createCalendarDto.services.reduce(
          (total, item) => total + (item.quantitySessions ?? 1),
          0,
        );

        if (!medicalRecord) {
          medicalRecord = manager.create(MedicalRecord, {
            title,
            status: MedicalRecordStatusEnum.PENDING,
            clientId: client.id,
            userId: userAuth.id,
            totalValue: createCalendarDto.totalValue ?? null,
          });
          medicalRecord = await manager.save(medicalRecord);
        }

        const newAppointment = manager.create(Appointment, {
          title,
          startDate: createCalendarDto.start.dateTime,
          endDate,
          status: AppointmentStatusEnum.CREATED,
          medicalRecordId: medicalRecord.id,
          userId: userAuth.id,
          quantitySessions: totalQuantitySessions || 1,
          totalValue: createCalendarDto.totalValue ?? null,
          attended: null,
        });

        const savedAppointment = await manager.save(newAppointment);

        const medicalRecordServices = createCalendarDto.services.map(
          (item: CreateCalendarServiceItemDto) =>
            manager.create(MedicalRecordService, {
              medicalRecordId: medicalRecord!.id,
              appointmentId: savedAppointment.id,
              serviceId: item.serviceId,
              durationMinutes: item.durationMinutes,
              totalValue: item.courtesy ? 0 : item.totalValue,
              courtesy: item.courtesy ?? false,
              discount: item.discount ?? 0,
              quantitySessions: item.quantitySessions ?? 1,
            }),
        );

        await manager.save(medicalRecordServices);

        return savedAppointment;
      });

      if (createCalendarDto.sendWhatsAppConfirmation) {
        void this.calendarReminderService.sendCreationConfirmation(saved.id);
      }

      return saved;
    } catch (error: Error | any) {
      const message = `Ocorreu um erro ao criar o evento. Mais Detalhes: ${JSON.stringify(error?.errors) ?? error?.response?.message}`;
      if (error instanceof HttpException) throw error;
      Logger.error(message, error?.stack ?? error?.message);
      throw new BadRequestException(message);
    }
  }

  async findAll(
    queryParams: FilterCalendarDto,
    user: User,
  ): Promise<ResponseMedicalRecordResumeDto[]> {
    try {
      const userAuth = await this.dataSource.manager.findOne(User, {
        where: { id: user.id },
        select: ['id', 'name'],
      });

      if (!userAuth) {
        throw new NotFoundException('Não conseguimos encontrar o solicitante.');
      }

      const where: FindManyOptions<Appointment>['where'] = {
        userId: userAuth.id,
      };

      if (queryParams.start && queryParams.end) {
        where.startDate = Between(
          new Date(queryParams.start),
          new Date(queryParams.end),
        );
      }

      const appointments = await this.appointmentRepository.find({
        where,
        relations: [
          'medicalRecord',
          'medicalRecord.client',
          'medicalRecordServices',
        ],
        order: { startDate: 'ASC' },
      });

      return appointments
        .filter(
          (appointment) =>
            appointment.medicalRecord?.status !== MedicalRecordStatusEnum.CANCELED,
        )
        .map((appointment) => this.mapToEventDto(appointment));
    } catch (error) {
      const message = 'Ocorreu um erro ao buscar os eventos.';
      if (error instanceof HttpException) throw error;
      Logger.error(message, (error as any)?.stack ?? (error as any)?.message);
      throw new BadRequestException(message);
    }
  }

  async remove(appointmentId: string, user: User) {
    try {
      const userAuth = await this.dataSource.manager.findOne(User, {
        where: { id: user.id },
        select: ['id'],
      });

      if (!userAuth) {
        throw new NotFoundException('Não conseguimos encontrar o solicitante.');
      }

      const appointment = await this.appointmentRepository.findOne({
        where: { id: Number(appointmentId), userId: userAuth.id },
      });

      if (!appointment) {
        throw new BadRequestException(
          'Não conseguimos encontrar o evento agendado, tente novamente!',
        );
      }

      if (
        appointment.status !== AppointmentStatusEnum.CREATED &&
        appointment.status !== AppointmentStatusEnum.IN_PROGRESS
      ) {
        throw new BadRequestException(
          'Somente agendamentos criados ou em andamento podem ser cancelados.',
        );
      }

      const canceledStatus =
        appointment.status === AppointmentStatusEnum.IN_PROGRESS
          ? AppointmentStatusEnum.CANCELED_SCHEDULE
          : AppointmentStatusEnum.CANCELED;

      await this.appointmentRepository.update(appointment.id, {
        status: canceledStatus,
        canceledBy: AppointmentCanceledByEnum.ADMIN,
      });

      return { success: true, id: appointment.id };
    } catch (error) {
      const message = 'Ocorreu um erro ao cancelar o evento.';
      if (error instanceof HttpException) throw error;
      Logger.error(message, (error as any)?.stack ?? (error as any)?.message);
      throw new BadRequestException(message);
    }
  }

  async confirmPresenceByProfessional(
    appointmentId: string,
    user: User,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const userAuth = await this.dataSource.manager.findOne(User, {
        where: { id: user.id },
        select: ['id'],
      });

      if (!userAuth) {
        throw new NotFoundException('Não conseguimos encontrar o solicitante.');
      }

      const appointment = await this.appointmentRepository.findOne({
        where: { id: Number(appointmentId), userId: userAuth.id },
        relations: ['medicalRecord', 'medicalRecord.client'],
      });

      if (!appointment) {
        throw new BadRequestException(
          'Não conseguimos encontrar o evento agendado, tente novamente!',
        );
      }

      if (appointment.status !== AppointmentStatusEnum.CREATED) {
        throw new BadRequestException(
          'Somente agendamentos com status criado podem ter a presença confirmada.',
        );
      }

      await this.appointmentRepository.update(appointment.id, {
        status: AppointmentStatusEnum.CONFIRMED_SCHEDULE,
        confirmedAt: new Date(),
      });

      await this.notificationService.create({
        description: `Presença confirmada pelo profissional para ${appointment.medicalRecord?.client?.name ?? 'paciente'}`,
        medicalRecordId: appointment.medicalRecordId,
        userId: appointment.userId,
      });

      return {
        success: true,
        message: 'Presença confirmada com sucesso!',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const message =
        error instanceof Error ? error.message : 'Erro ao confirmar presença';
      Logger.error(message, error instanceof Error ? error.stack : '');
      throw new BadRequestException(message);
    }
  }

  async markAttendance(
    appointmentId: string,
    attended: boolean,
    user: User,
  ): Promise<{
    success: boolean;
    message: string;
    attended: boolean;
    status: string;
  }> {
    try {
      const userAuth = await this.dataSource.manager.findOne(User, {
        where: { id: user.id },
        select: ['id'],
      });

      if (!userAuth) {
        throw new NotFoundException('Não conseguimos encontrar o solicitante.');
      }

      const appointment = await this.appointmentRepository.findOne({
        where: { id: Number(appointmentId), userId: userAuth.id },
        relations: ['medicalRecord', 'medicalRecord.client'],
      });

      if (!appointment) {
        throw new BadRequestException(
          'Não conseguimos encontrar o evento agendado, tente novamente!',
        );
      }

      if (
        appointment.status !== AppointmentStatusEnum.CONFIRMED_SCHEDULE &&
        appointment.status !== AppointmentStatusEnum.IN_PROGRESS
      ) {
        throw new BadRequestException(
          'Somente agendamentos confirmados ou em andamento podem registrar comparecimento.',
        );
      }

      // Compareceu: mantém o status atual e marca attended=true.
      // Faltou: marca attended=false e cancela o agendamento (canceled_schedule).
      const nextStatus = attended
        ? appointment.status
        : AppointmentStatusEnum.CANCELED_SCHEDULE;

      await this.appointmentRepository.update(appointment.id, {
        attended,
        status: nextStatus,
        ...(attended
          ? {}
          : { canceledBy: AppointmentCanceledByEnum.ADMIN }),
      });

      const clientName =
        appointment.medicalRecord?.client?.name ?? 'paciente';

      await this.notificationService.create({
        description: attended
          ? `Comparecimento confirmado para ${clientName}`
          : `Falta registrada e agendamento cancelado para ${clientName}`,
        medicalRecordId: appointment.medicalRecordId,
        userId: appointment.userId,
      });

      return {
        success: true,
        attended,
        status: nextStatus,
        message: attended
          ? 'Comparecimento registrado com sucesso!'
          : 'Falta registrada e agendamento cancelado.',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const message =
        error instanceof Error
          ? error.message
          : 'Erro ao registrar comparecimento';
      Logger.error(message, error instanceof Error ? error.stack : '');
      throw new BadRequestException(message);
    }
  }

  async getConfirmationPreview(urlSafeToken: string) {
    const appointment =
      await this.findAppointmentByUrlSafeToken(urlSafeToken);

    const startDate = appointment.startDate
      ? new Date(appointment.startDate)
      : new Date(appointment.updatedAt);

    return {
      attendance: {
        appointmentId: String(appointment.id),
        patientName: appointment.medicalRecord?.client?.name ?? '',
        appointmentDate: startDate.toISOString().split('T')[0],
        appointmentTime: startDate.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        doctorName: appointment.user?.name ?? '',
        specialty: '',
      },
      status: this.getConfirmationStatus(appointment.status),
    };
  }

  async confirmAttendanceByLink(
    urlSafeToken: string,
  ): Promise<{ success: boolean; message: string }> {
    const appointment =
      await this.findAppointmentByUrlSafeToken(urlSafeToken);
    const { appointmentId, uuid } = this.decryptConfirmationPayload(
      appointment.confirmationToken!,
    );

    return this.confirmAttendance(appointmentId, uuid);
  }

  async cancelAttendanceByLink(
    urlSafeToken: string,
  ): Promise<{ success: boolean; message: string }> {
    const appointment =
      await this.findAppointmentByUrlSafeToken(urlSafeToken);
    const { appointmentId, uuid } = this.decryptConfirmationPayload(
      appointment.confirmationToken!,
    );

    return this.cancelAttendance(appointmentId, uuid);
  }

  async confirmAttendance(
    appointmentId: string,
    token: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const appointment = await this.appointmentRepository.findOne({
        where: { id: Number(appointmentId) },
        relations: ['medicalRecord', 'medicalRecord.client', 'user'],
      });

      if (!appointment) {
        throw new BadRequestException('Consulta não encontrada');
      }

      if (!appointment.confirmationToken) {
        throw new BadRequestException('Consulta sem token de confirmação');
      }

      try {
        const { appointmentId: decryptedId, uuid: decryptedUuid } =
          this.decryptConfirmationPayload(appointment.confirmationToken);

        if (decryptedId !== appointmentId || decryptedUuid !== token) {
          throw new Error('Token mismatch');
        }
      } catch {
        throw new BadRequestException('Token inválido para esta consulta');
      }

      if (appointment.status === AppointmentStatusEnum.CONFIRMED_SCHEDULE) {
        throw new BadRequestException('Presença já foi confirmada');
      }

      appointment.status = AppointmentStatusEnum.CONFIRMED_SCHEDULE;
      appointment.confirmedAt = new Date();

      await this.appointmentRepository.save(appointment);

      await this.notificationService.create({
        description: `Presença confirmada por ${appointment.medicalRecord?.client?.name ?? 'usuário'}`,
        medicalRecordId: appointment.medicalRecordId,
        userId: appointment.userId,
      });

      void this.calendarReminderService.sendProfessionalAppointmentConfirmedSilently(
        appointment.id,
      );

      return {
        success: true,
        message: 'Presença confirmada com sucesso!',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const message =
        error instanceof Error ? error.message : 'Erro ao confirmar presença';
      Logger.error(message, error instanceof Error ? error.stack : '');
      throw new BadRequestException(message);
    }
  }

  async cancelAttendance(
    appointmentId: string,
    token: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const appointment = await this.appointmentRepository.findOne({
        where: { id: Number(appointmentId) },
        relations: ['medicalRecord', 'medicalRecord.client', 'user'],
      });

      if (!appointment) {
        throw new BadRequestException('Consulta não encontrada');
      }

      if (!appointment.confirmationToken) {
        throw new BadRequestException('Consulta sem token de confirmação');
      }

      try {
        const { appointmentId: decryptedId, uuid: decryptedUuid } =
          this.decryptConfirmationPayload(appointment.confirmationToken);

        if (decryptedId !== appointmentId || decryptedUuid !== token) {
          throw new Error('Token mismatch');
        }
      } catch {
        throw new BadRequestException('Token inválido para esta consulta');
      }

      if (
        appointment.status === AppointmentStatusEnum.CANCELED_SCHEDULE ||
        appointment.status === AppointmentStatusEnum.CANCELED
      ) {
        throw new BadRequestException('Consulta já foi cancelada');
      }

      appointment.status = AppointmentStatusEnum.CANCELED_SCHEDULE;
      appointment.canceledBy = AppointmentCanceledByEnum.CLIENT;

      await this.appointmentRepository.save(appointment);

      await this.notificationService.create({
        description: `Presença cancelado por ${appointment.medicalRecord?.client?.name ?? 'usuário'}`,
        medicalRecordId: appointment.medicalRecordId,
        userId: appointment.userId,
      });

      void this.calendarReminderService.sendProfessionalAppointmentCanceledSilently(
        appointment.id,
      );

      return {
        success: true,
        message: 'Consulta cancelada com sucesso!',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const message =
        error instanceof Error ? error.message : 'Erro ao cancelar consulta';
      Logger.error(message, error instanceof Error ? error.stack : '');
      throw new BadRequestException(message);
    }
  }

  private async findAppointmentByUrlSafeToken(
    urlSafeToken: string,
  ): Promise<Appointment> {
    let encryptedHex: string;

    try {
      encryptedHex = Buffer.from(urlSafeToken, 'base64url').toString('hex');
    } catch {
      throw new BadRequestException('Link inválido ou expirado');
    }

    const appointment = await this.appointmentRepository.findOne({
      where: { confirmationToken: encryptedHex },
      relations: ['medicalRecord', 'medicalRecord.client', 'user'],
    });

    if (!appointment?.confirmationToken) {
      throw new BadRequestException('Link inválido ou expirado');
    }

    const { appointmentId } = this.decryptConfirmationPayload(
      appointment.confirmationToken,
    );

    if (appointmentId !== String(appointment.id)) {
      const legacyAppointment = await this.appointmentRepository.findOne({
        where: { medicalRecordId: Number(appointmentId) },
        relations: ['medicalRecord', 'medicalRecord.client', 'user'],
      });

      if (
        legacyAppointment?.confirmationToken === appointment.confirmationToken
      ) {
        return legacyAppointment;
      }

      throw new BadRequestException('Link inválido ou expirado');
    }

    return appointment;
  }

  private decryptConfirmationPayload(encryptedHex: string): {
    appointmentId: string;
    uuid: string;
  } {
    const algorithm = this.configService.get<string>('cripto.alg');
    const keyBuffer = new Uint8Array(
      Buffer.from(this.configService.get<string>('cripto.secret') || '', 'hex'),
    );
    const iv = new Uint8Array(
      Buffer.from(this.configService.get<string>('cripto.iv') || '', 'hex'),
    );

    const decipher = crypto.createDecipheriv(
      algorithm as any,
      keyBuffer as any,
      iv as any,
    );
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const [appointmentId, uuid] = decrypted.split('@');

    if (!appointmentId || !uuid) {
      throw new Error('Invalid token payload');
    }

    return { appointmentId, uuid };
  }

  private getConfirmationStatus(
    status: string,
  ): 'pending' | 'confirmed' | 'cancelled' {
    if (status === AppointmentStatusEnum.CONFIRMED_SCHEDULE) {
      return 'confirmed';
    }

    if (
      status === AppointmentStatusEnum.CANCELED_SCHEDULE ||
      status === AppointmentStatusEnum.CANCELED
    ) {
      return 'cancelled';
    }

    return 'pending';
  }

  private mapToEventDto(appointment: Appointment): ResponseMedicalRecordResumeDto {
    const medicalRecord = appointment.medicalRecord;
    const services = appointment.medicalRecordServices ?? [];
    const quantitySessions =
      services.length > 0
        ? services.reduce(
            (total, service) => total + (service.quantitySessions ?? 1),
            0,
          )
        : appointment.quantitySessions ?? 1;

    return {
      id: String(appointment.id),
      summary: appointment.title || 'Agendamento',
      description: appointment.title || 'Nenhuma descrição encontrada',
      start: {
        dateTime: appointment.startDate?.toISOString(),
      },
      end: {
        dateTime: appointment.endDate?.toISOString(),
      },
      clientId: medicalRecord?.clientId ? String(medicalRecord.clientId) : '',
      clientName: medicalRecord?.client?.name || '',
      medicalRecord: {
        id: medicalRecord?.id ?? 0,
        title: medicalRecord?.title || appointment.title || 'Agendamento',
        symptoms: medicalRecord?.symptoms || '',
      },
      status: appointment.status,
      attended: appointment.attended ?? null,
      canceledBy: appointment.canceledBy ?? null,
      quantitySessions,
    };
  }
}
