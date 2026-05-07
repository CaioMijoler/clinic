import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
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

const ALGORITHM = process.env.CRIPTO_ALG || 'aes-256-ctr';
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPT_SECRET_KEY || '', 'hex');
const ENCRYPT_IV = Buffer.from(process.env.ENCRYPT_IV || '', 'hex');

@Injectable()
export class CalendarService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepository: Repository<MedicalRecord>,
  ) {}

  async create(createCalendarDto: CreateCalendarDto, user: User) {
    try {
      const dataSourceResponse = await this.dataSource.transaction(
        async (manager) => {
          let medicalRecord = null;

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
            medicalRecord = await manager.findOne(MedicalRecord, {
              where: { id: createCalendarDto.medicalRecordId },
            });
            if (!medicalRecord) {
              throw new NotFoundException(
                'Não conseguimos encontrar o prontuário.',
              );
            }
          }

          return { medicalRecord, user: userAuth, client };
        },
      );

      const title = `${createCalendarDto.summary}`.trim();

      const saved = await this.medicalRecordRepository.save({
        ...dataSourceResponse.medicalRecord,
        title,
        startDate: createCalendarDto.start.dateTime,
        endDate: createCalendarDto.end.dateTime,
        status: MedicalRecordStatusEnum.SCHEDULED,
        clientId: dataSourceResponse.client.id,
        userId: dataSourceResponse.user.id,
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

      // Validação do Token Criptografado (Modo CTR com IV fixo)
      try {
        const decipher = crypto.createDecipheriv(
          ALGORITHM,
          ENCRYPTION_KEY,
          ENCRYPT_IV,
        );
        let decrypted = decipher.update(
          medicalRecord.confirmationToken,
          'hex',
          'utf8',
        );
        decrypted += decipher.final('utf8');

        const [decryptedId, decryptedUuid] = decrypted.split('@');

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

      await this.notifyProfessional(medicalRecord);

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

      // Validação do Token Criptografado (Modo CTR com IV fixo)
      try {
        const decipher = crypto.createDecipheriv(
          ALGORITHM,
          ENCRYPTION_KEY,
          ENCRYPT_IV,
        );
        let decrypted = decipher.update(
          medicalRecord.confirmationToken,
          'hex',
          'utf8',
        );
        decrypted += decipher.final('utf8');

        const [decryptedId, decryptedUuid] = decrypted.split('@');

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

  private async notifyProfessional(medicalRecord: MedicalRecord) {
    try {
      Logger.log(
        `Paciente ${medicalRecord.clientId} confirmou presença na consulta ${medicalRecord.id}`,
      );
      // TODO: Implementar envio de notificação para o profissional via WhatsApp/Email
    } catch (error) {
      Logger.error(
        'Erro ao notificar profissional',
        error instanceof Error ? error.stack : '',
      );
    }
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
