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
import { Client } from '../clients/entities/client.entity';
import { ResponseMedicalRecordResumeDto } from './dto/response-medical-record-resume.dto';
import * as crypto from 'crypto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class CalendarService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepository: Repository<MedicalRecord>,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
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

        if (createCalendarDto.medicalRecordId) {
          const medicalRecord = await manager.findOne(MedicalRecord, {
            where: { id: createCalendarDto.medicalRecordId },
          });
          if (!medicalRecord) {
            throw new NotFoundException(
              'Não conseguimos encontrar o prontuário.',
            );
          }
        }

        const startDate = new Date(createCalendarDto.start.dateTime);
        const endDate = new Date(createCalendarDto.end.dateTime);

        const conflictingRecords = await manager
          .createQueryBuilder(MedicalRecord, 'mr')
          .where('mr.user_id = :userId', { userId: userAuth.id })
          .andWhere('mr.status IN (:...statuses)', {
            statuses: [MedicalRecordStatusEnum.SCHEDULED, MedicalRecordStatusEnum.CONFIRMED_SCHEDULE],
          })
          .andWhere(
            '(mr.start_date < :endDate AND mr.end_date > :startDate)',
            { startDate, endDate },
          )
          .getOne();

        if (conflictingRecords) {
          throw new BadRequestException(
            'Horário indisponível. Já existe um agendamento neste horário.',
          );
        }

        const title = `${createCalendarDto.summary}`.trim();

        const newMedicalRecord = manager.create(MedicalRecord, {
          title,
          startDate: createCalendarDto.start.dateTime,
          endDate: createCalendarDto.end.dateTime,
          status: MedicalRecordStatusEnum.SCHEDULED,
          clientId: client.id,
          userId: userAuth.id,
        });

        return await manager.save(newMedicalRecord);
      });

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

      const where: FindManyOptions<MedicalRecord>['where'] = {
        userId: userAuth.id,
      };

      if (queryParams.start && queryParams.end) {
        where.startDate = Between(
          new Date(queryParams.start),
          new Date(queryParams.end),
        );
      }

      const medicalRecords = await this.medicalRecordRepository.find({
        where,
        relations: ['client'],
        order: { startDate: 'ASC' },
      });

      return medicalRecords.map((record) => this.mapToEventDto(record));
    } catch (error) {
      const message = 'Ocorreu um erro ao buscar os eventos.';
      if (error instanceof HttpException) throw error;
      Logger.error(message, (error as any)?.stack ?? (error as any)?.message);
      throw new BadRequestException(message);
    }
  }

  async remove(medicalRecordId: string, user: User) {
    try {
      const userAuth = await this.dataSource.manager.findOne(User, {
        where: { id: user.id },
        select: ['id'],
      });

      if (!userAuth) {
        throw new NotFoundException('Não conseguimos encontrar o solicitante.');
      }

      const medicalRecord = await this.medicalRecordRepository.findOne({
        where: { id: Number(medicalRecordId), userId: userAuth.id },
      });

      if (!medicalRecord) {
        throw new BadRequestException(
          'Não conseguimos encontrar o evento agendado, tente novamente!',
        );
      }

      await this.medicalRecordRepository.update(medicalRecord.id, {
        status: MedicalRecordStatusEnum.CANCELED,
      });

      return { success: true, id: medicalRecord.id };
    } catch (error) {
      const message = 'Ocorreu um erro ao cancelar o evento.';
      if (error instanceof HttpException) throw error;
      Logger.error(message, (error as any)?.stack ?? (error as any)?.message);
      throw new BadRequestException(message);
    }
  }

  async getConfirmationPreview(urlSafeToken: string) {
    const medicalRecord =
      await this.findMedicalRecordByUrlSafeToken(urlSafeToken);

    const startDate = medicalRecord.startDate
      ? new Date(medicalRecord.startDate)
      : new Date(medicalRecord.updatedAt);

    return {
      attendance: {
        appointmentId: String(medicalRecord.id),
        patientName: medicalRecord.client?.name ?? '',
        appointmentDate: startDate.toISOString().split('T')[0],
        appointmentTime: startDate.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        doctorName: medicalRecord.user?.name ?? '',
        specialty: '',
      },
      status: this.getConfirmationStatus(medicalRecord.status),
    };
  }

  async confirmAttendanceByLink(
    urlSafeToken: string,
  ): Promise<{ success: boolean; message: string }> {
    const medicalRecord =
      await this.findMedicalRecordByUrlSafeToken(urlSafeToken);
    const { medicalRecordId, uuid } = this.decryptConfirmationPayload(
      medicalRecord.confirmationToken,
    );

    return this.confirmAttendance(medicalRecordId, uuid);
  }

  async cancelAttendanceByLink(
    urlSafeToken: string,
  ): Promise<{ success: boolean; message: string }> {
    const medicalRecord =
      await this.findMedicalRecordByUrlSafeToken(urlSafeToken);
    const { medicalRecordId, uuid } = this.decryptConfirmationPayload(
      medicalRecord.confirmationToken,
    );

    return this.cancelAttendance(medicalRecordId, uuid);
  }

  async confirmAttendance(
    medicalRecordId: string,
    token: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const medicalRecord = await this.medicalRecordRepository.findOne({
        where: {
          id: Number(medicalRecordId),
        },
        relations: ['client', 'user'],
      });

      if (!medicalRecord) {
        throw new BadRequestException('Consulta não encontrada');
      }

      if (!medicalRecord.confirmationToken) {
        throw new BadRequestException('Consulta sem token de confirmação');
      }

      try {
        const { medicalRecordId: decryptedId, uuid: decryptedUuid } =
          this.decryptConfirmationPayload(medicalRecord.confirmationToken);

        if (decryptedId !== medicalRecordId || decryptedUuid !== token) {
          throw new Error('Token mismatch');
        }
      } catch (err) {
        throw new BadRequestException('Token inválido para esta consulta');
      }

      if (medicalRecord.status === MedicalRecordStatusEnum.CONFIRMED_SCHEDULE) {
        throw new BadRequestException('Presença já foi confirmada');
      }

      medicalRecord.status = MedicalRecordStatusEnum.CONFIRMED_SCHEDULE;
      medicalRecord.confirmedAt = new Date();

      await this.medicalRecordRepository.save(medicalRecord);

      await this.notificationService.create({
        description: `Presença confirmada por ${medicalRecord.client?.name ?? 'usuário'}`,
        medicalRecordId: medicalRecord.id,
        userId: medicalRecord.userId,
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

  async cancelAttendance(
    medicalRecordId: string,
    token: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const medicalRecord = await this.medicalRecordRepository.findOne({
        where: {
          id: Number(medicalRecordId),
        },
        relations: ['client', 'user'],
      });

      if (!medicalRecord) {
        throw new BadRequestException('Consulta não encontrada');
      }

      if (!medicalRecord.confirmationToken) {
        throw new BadRequestException('Consulta sem token de confirmação');
      }

      try {
        const { medicalRecordId: decryptedId, uuid: decryptedUuid } =
          this.decryptConfirmationPayload(medicalRecord.confirmationToken);

        if (decryptedId !== medicalRecordId || decryptedUuid !== token) {
          throw new Error('Token mismatch');
        }
      } catch (err) {
        throw new BadRequestException('Token inválido para esta consulta');
      }

      if (
        medicalRecord.status === MedicalRecordStatusEnum.CANCELED_SCHEDULE ||
        medicalRecord.status === MedicalRecordStatusEnum.CANCELED
      ) {
        throw new BadRequestException('Consulta já foi cancelada');
      }

      medicalRecord.status = MedicalRecordStatusEnum.CANCELED_SCHEDULE;

      await this.medicalRecordRepository.save(medicalRecord);

      await this.notificationService.create({
        description: `Presença cancelado por ${medicalRecord.client?.name ?? 'usuário'}`,
        medicalRecordId: medicalRecord.id,
        userId: medicalRecord.userId,
      });

      await this.notifyProfessionalCancelation(medicalRecord);

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

  private async findMedicalRecordByUrlSafeToken(
    urlSafeToken: string,
  ): Promise<MedicalRecord> {
    let encryptedHex: string;

    try {
      encryptedHex = Buffer.from(urlSafeToken, 'base64url').toString('hex');
    } catch {
      throw new BadRequestException('Link inválido ou expirado');
    }

    const medicalRecord = await this.medicalRecordRepository.findOne({
      where: { confirmationToken: encryptedHex },
      relations: ['client', 'user'],
    });

    if (!medicalRecord?.confirmationToken) {
      throw new BadRequestException('Link inválido ou expirado');
    }

    const { medicalRecordId } = this.decryptConfirmationPayload(
      medicalRecord.confirmationToken,
    );

    if (medicalRecordId !== String(medicalRecord.id)) {
      throw new BadRequestException('Link inválido ou expirado');
    }

    return medicalRecord;
  }

  private decryptConfirmationPayload(encryptedHex: string): {
    medicalRecordId: string;
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

    const [medicalRecordId, uuid] = decrypted.split('@');

    if (!medicalRecordId || !uuid) {
      throw new Error('Invalid token payload');
    }

    return { medicalRecordId, uuid };
  }

  private getConfirmationStatus(
    status: string,
  ): 'pending' | 'confirmed' | 'cancelled' {
    if (status === MedicalRecordStatusEnum.CONFIRMED_SCHEDULE) {
      return 'confirmed';
    }

    if (
      status === MedicalRecordStatusEnum.CANCELED_SCHEDULE ||
      status === MedicalRecordStatusEnum.CANCELED
    ) {
      return 'cancelled';
    }

    return 'pending';
  }

  private async notifyProfessionalCancelation(medicalRecord: MedicalRecord) {
    try {
      Logger.log(
        `Paciente ${medicalRecord.clientId} cancelou a consulta ${medicalRecord.id}`,
      );
      // TODO: Implementar envio de notificação de cancelamento para o profissional
    } catch (error) {
      Logger.error(
        'Erro ao notificar cancelamento ao profissional',
        error instanceof Error ? error.stack : '',
      );
    }
  }

  private mapToEventDto(record: MedicalRecord): ResponseMedicalRecordResumeDto {
    return {
      id: String(record.id),
      summary: record.title || 'Agendamento',
      description: record.title || 'Nenhuma descrição encontrada',
      start: {
        dateTime: record.startDate?.toISOString(),
      },
      end: {
        dateTime: record.endDate?.toISOString(),
      },
      clientId: record.clientId ? String(record.clientId) : '',
      clientName: record.client?.name || '',
      medicalRecord: {
        id: record.id,
        title: record.title || 'Agendamento',
        symptoms: record.symptoms || '',
      },
    };
  }
}
