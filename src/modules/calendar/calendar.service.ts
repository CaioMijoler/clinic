import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { google } from 'googleapis';
import { ConfigService } from '@nestjs/config';
import { FilterCalendarDto } from './dto/filter-calendar.dto';
import { DataSource, In, Repository } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { MedicalRecord } from '../medical-record/entities/medical-record.entity';
import { MedicalRecordStatusEnum } from '../../utils/enum/medical-record.enum';
import { Client } from '../clients/entities/client.entity';
import { v4 as uuidv4 } from 'uuid';
import { ResponseMedicalRecordResumeDto } from './dto/response-medical-record-resume.dto';

@Injectable()
export class CalendarService {
  private calendar;
  private auth;

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepository: Repository<MedicalRecord>,
    private readonly configService: ConfigService,
  ) {}

  async create(createCalendarDto: CreateCalendarDto, user: User) {
    try {
      const { ...calendarData } = createCalendarDto;
      const dataSourceResponse = await this.dataSource.transaction(
        async (manager) => {
          let medicalRecord = null;
          const userAuth = await manager.findOne(User, {
            where: { id: user.id },
            select: [
              'id',
              'name',
              'whatsAppId',
              'whatsAppToken',
              'clientEmail',
              'privateKey',
              'calendarId',
            ],
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
          await this.googleAuth(userAuth);

          return {
            medicalRecord,
            calendar: createCalendarDto,
            user: userAuth,
            client,
          };
        },
      );

      const response = await this.calendar.events.insert({
        calendarId: dataSourceResponse.user.calendarId,
        resource: calendarData,
      });

      const payloadMedicalOrder = await this.createPayloadOrder(
        dataSourceResponse.calendar,
      );
      await this.medicalRecordRepository.save({
        ...dataSourceResponse.medicalRecord,
        title: payloadMedicalOrder.title,
        startDate: payloadMedicalOrder.startDate,
        endDate: payloadMedicalOrder.endDate,
        calendarGoogleId: response['data']['id'],
        status: MedicalRecordStatusEnum.SCHEDULED,
        clientId: dataSourceResponse.client.id,
        userId: dataSourceResponse.user.id,
      });

      return response['data'];
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
        select: ['id', 'name', 'clientEmail', 'privateKey', 'calendarId'],
      });

      if (!userAuth) {
        throw new NotFoundException('Não conseguimos encontrar o solicitante.');
      }

      await this.googleAuth(userAuth);

      const response = await this.calendar.events.list({
        auth: this.auth,
        calendarId: userAuth.calendarId,
        timeMin: queryParams.start,
        timeMax: queryParams.end,
        timeZone: 'America/Sao_Paulo',
      });
      const items = response['data']['items'] || [];

      const records = await this.medicalRecordRepository.find({
        where: {
          calendarGoogleId: In(items.map((item) => item.id)),
        },
      });

      const recordsMap = new Map(
        records.map((record) => [record.calendarGoogleId, record]),
      );

      const enrichedItems = items.map((item) =>
        this.mapToEventDto(item, recordsMap.get(item.id)),
      );

      return enrichedItems;
    } catch (error) {
      const message = 'Ocorreu um erro ao buscar os eventos.';
      if (error instanceof HttpException) throw error;
      Logger.error(message, (error as any)?.stack ?? (error as any)?.message);
      throw new BadRequestException(message);
    }
  }

  async remove(eventId: string, user: User) {
    try {
      const userAuth = await this.dataSource.manager.findOne(User, {
        where: { id: user.id },
        select: ['id', 'name', 'clientEmail', 'privateKey', , 'calendarId'],
      });

      if (!userAuth) {
        throw new NotFoundException('Não conseguimos encontrar o solicitante.');
      }

      const medicalRecord = await this.medicalRecordRepository.findOne({
        where: { calendarGoogleId: eventId },
      });

      if (!medicalRecord) {
        throw new BadRequestException(
          'Não conseguimos encontrar o evento agendado, tente novamente!',
        );
      }

      await this.googleAuth(userAuth);

      const response = await this.calendar.events.delete({
        auth: this.auth,
        calendarId: userAuth.calendarId,
        eventId: eventId,
      });

      await this.medicalRecordRepository.update(medicalRecord.id, {
        status: MedicalRecordStatusEnum.CANCELED,
      });

      if (response.data === '') {
        return 1;
      } else {
        return 0;
      }
    } catch (error) {
      const message = 'Ocorreu um erro ao deletar o evento.';

      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(message, (error as any)?.stack ?? (error as any)?.message);

      throw new BadRequestException(message);
    }
  }

  async googleAuth(user: User): Promise<void> {
    const SCOPES = this.configService.get<string>('calendar.url');

    this.auth = new google.auth.JWT({
      email: user.clientEmail,
      key: user.privateKey,
      scopes: SCOPES,
      subject: null,
    });

    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
  }

  async createPayloadOrder(
    calendarDto: CreateCalendarDto,
  ): Promise<CreateOrderDto> {
    return {
      medicalRecordId: calendarDto.medicalRecordId,
      calendarGoogleId: null,
      startDate: calendarDto.start.dateTime,
      endDate: calendarDto.start.dateTime,
      title: `${calendarDto.summary} ${calendarDto.description}`,
    };
  }

  async confirmAttendance(
    eventId: string,
    token: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const medicalRecord = await this.medicalRecordRepository.findOne({
        where: {
          id: Number(eventId),
          confirmationToken: token,
        },
        relations: ['client', 'user'],
      });

      if (!medicalRecord) {
        throw new BadRequestException(
          'Token inválido ou consulta não encontrada',
        );
      }

      if (medicalRecord.status === 'CONFIRMED') {
        throw new BadRequestException('Presença já foi confirmada');
      }

      medicalRecord.status = 'CONFIRMED';
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

  async generateConfirmationToken(eventId: string): Promise<string> {
    try {
      const medicalRecord = await this.medicalRecordRepository.findOne({
        where: { id: Number(eventId) },
      });

      if (!medicalRecord) {
        throw new NotFoundException('Consulta não encontrada');
      }

      const token = uuidv4();
      medicalRecord.confirmationToken = token;

      await this.medicalRecordRepository.save(medicalRecord);

      return token;
    } catch (error: Error | any) {
      const message: string = error
        ? error.message
        : 'Erro ao gerar token de confirmação';
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

  private mapToEventDto(
    item: any,
    medicalRecord?: MedicalRecord,
  ): ResponseMedicalRecordResumeDto {
    return {
      id: item.id,
      title: item.summary,
      description: item.description,
      start: { dateTime: item.start?.dateTime, timeZone: item.start?.timeZone },
      end: { dateTime: item.end?.dateTime, timeZone: item.end?.timeZone },
      status: item.status,
      link: item.htmlLink,
      summary: item.summary,
      medicalRecord: medicalRecord
        ? {
            id: medicalRecord.id,
            status: medicalRecord.status,
          }
        : null,
    };
  }
}
