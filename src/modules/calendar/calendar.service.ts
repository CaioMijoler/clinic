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
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { MedicalRecord } from '../medical-record/entities/medical-record.entity';
import { MedicalRecordStatusEnum } from '../../utils/enum/medical-record.enum';

@Injectable()
export class CalendarService {
  private calendar;
  private auth;

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepository: Repository<MedicalRecord>,
    private readonly configService: ConfigService,
  ) {
    // const CREDENTIALS = JSON.parse(
    //   this.configService.get<string>('calendar.credentials'),
    // );
    //
  }

  async create(createCalendarDto: CreateCalendarDto, user: User) {
    try {
      const { ...calendarData } = createCalendarDto;
      const dataSourceResponse = await this.dataSource.transaction(
        async (manager) => {
          const userAuth = await manager.findOne(User, {
            where: { id: user.id },
            select: [
              'id',
              'name',
              'whatsAppId',
              'whatsAppToken',
              'credentials',
              'calendarId',
            ],
          });
          if (!userAuth) {
            throw new NotFoundException(
              'Não conseguimos encontrar o solicitante.',
            );
          }
          const medicalRecord = await manager.findOne(MedicalRecord, {
            where: { id: createCalendarDto.medicalRecordId },
          });

          if (!medicalRecord) {
            throw new NotFoundException(
              'Não conseguimos encontrar o prontuário.',
            );
          }
          await this.googleAuth(userAuth);

          return {
            medicalRecord,
            calendar: createCalendarDto,
            user: userAuth,
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
      await this.medicalRecordRepository.update(
        dataSourceResponse.calendar.medicalRecordId,
        {
          title: payloadMedicalOrder.title,
          startDate: payloadMedicalOrder.startDate,
          endDate: payloadMedicalOrder.endDate,
          calendarGoogleId: response['data']['id'],
          status: MedicalRecordStatusEnum.SCHEDULED,
        },
      );

      return response['data'];
    } catch (error) {
      const err = error as any;
      const message = `Ocorreu um erro ao criar o evento. Mais Detalhes: ${JSON.stringify(err?.errors) ?? err?.response?.message}`;
      if (error instanceof HttpException) throw error;
      Logger.error(message, err?.stack ?? err?.message);
      throw new BadRequestException(message);
    }
  }

  async findAll(queryParams: FilterCalendarDto, user: User) {
    try {
      const userAuth = await this.dataSource.manager.findOne(User, {
        where: { id: user.id },
        select: ['id', 'name', 'credentials', 'calendarId'],
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

      const items = response['data']['items'];
      return items;
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
        select: ['id', 'name', 'credentials', 'calendarId'],
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
        status: MedicalRecordStatusEnum.CANCELED_SCHEDULE,
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
    const CREDENTIALS = user.credentials;
    const SCOPES = this.configService.get<string>('calendar.url');

    this.auth = new google.auth.JWT(
      CREDENTIALS.client_email,
      null,
      CREDENTIALS.private_key,
      SCOPES,
    );

    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
  }

  async createPayloadOrder(
    calendarDto: CreateCalendarDto,
  ): Promise<CreateOrderDto> {
    // const startDate = moment(calendarDto.start.dateTime)
    //   .subtract(3, 'hours')
    //   .toString();

    // const endDate = moment(calendarDto.end.dateTime)
    //   .subtract(3, 'hours')
    //   .toString();

    return {
      medicalRecordId: calendarDto.medicalRecordId,
      calendarGoogleId: null,
      startDate: calendarDto.start.dateTime,
      endDate: calendarDto.start.dateTime,
      title: `${calendarDto.summary} ${calendarDto.description}`,
    };
  }
}
