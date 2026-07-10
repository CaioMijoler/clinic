import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Not, Repository } from 'typeorm';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Appointment } from '../appointments/entities/appointment.entity';
import { User } from '../user/entities/user.entity';
import { AppointmentStatusEnum } from '../../utils/enum/appointment-status.enum';

import { DashboardFilterDto } from './dto/dashboard-filter.dto';
import { DashboardMedicalRecordFilterDto } from './dto/dashboard-medical-record-filter.dto';
import { DashboardPeriodEnum } from '../../utils/enum/dashboard.enum';
import { TDashboardStatsResponse } from './dto/dashboard-response.dto';
import { IPaginate } from '../../utils/paginate';
import { DashboardAppointmentResponseDto } from './dto/dashboard-appointment-response.dto';

const DEFAULT_DASHBOARD_STATUSES = [
  AppointmentStatusEnum.CREATED,
  AppointmentStatusEnum.SCHEDULED,
  AppointmentStatusEnum.CONFIRMED_SCHEDULE,
  AppointmentStatusEnum.CANCELED_SCHEDULE,
];

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  async getStatistics(user: User, filter: DashboardFilterDto): Promise<TDashboardStatsResponse> {
    try {
      const { startDate, endDate } = this.getPeriodRange(filter.period);
      return this.getStatsForPeriod(startDate, endDate, user.id);
    } catch (error) {
     throw new BadGatewayException('Erro ao retornoar dados do dashboard', error.message);
    }
  }

  async getMedicalRecords(
    user: User,
    filter: DashboardMedicalRecordFilterDto,
  ): Promise<IPaginate<DashboardAppointmentResponseDto>> {
    try {
      const currentPage = filter.current_page ?? 1;
      const perPage = filter.per_page ?? 5;
      const { startDate, endDate } = this.getPeriodRange(filter.period);
      const statuses = this.getStatusFilter(filter.status);

      const queryBuilder = this.appointmentRepository
        .createQueryBuilder('appointment')
        .leftJoinAndSelect('appointment.medicalRecord', 'medicalRecord')
        .where('appointment.userId = :userId', { userId: user.id })
        .andWhere('appointment.startDate BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        .andWhere('appointment.status IN (:...statuses)', { statuses })
        .orderBy('appointment.startDate', 'ASC');

      const skip = (currentPage - 1) * perPage;
      const [data, total] = await queryBuilder
        .skip(skip)
        .take(perPage)
        .getManyAndCount();

      return {
        pagination: {
          current_page: currentPage,
          per_page: perPage,
          total,
        },
        data: data.map((appointment) => this.mapToDashboardItem(appointment)),
      };
    } catch (error) {
      throw new BadGatewayException(
        'Erro ao retornar agendamentos do dashboard',
        error.message,
      );
    }
  }

  private mapToDashboardItem(
    appointment: Appointment,
  ): DashboardAppointmentResponseDto {
    const medicalRecord = appointment.medicalRecord;

    return {
      id: appointment.id,
      medicalRecordId: appointment.medicalRecordId,
      symptoms: medicalRecord?.symptoms ?? '',
      clinicalExam: medicalRecord?.clinicalExam ?? '',
      completeClinicalExam: medicalRecord?.completeClinicalExam ?? '',
      conclusion: medicalRecord?.conclusion ?? '',
      clientId: medicalRecord?.clientId ?? 0,
      userId: appointment.userId,
      status: appointment.status,
      medicalRecordStatus: medicalRecord?.status,
      startDate: appointment.startDate,
      endDate: appointment.endDate,
      title: appointment.title ?? medicalRecord?.title ?? '',
      totalValue: appointment.totalValue ?? medicalRecord?.totalValue ?? null,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  }

  private async getStatsForPeriod(startDate: Date, endDate: Date, userId: number) {
    const [total, confirmed, canceled] = await Promise.all([
      this.appointmentRepository.count({
        where: {
          userId,
          startDate: Between(startDate, endDate),
          status: Not(In([AppointmentStatusEnum.CANCELED, AppointmentStatusEnum.CANCELED_SCHEDULE])),
        },
      }),

      this.appointmentRepository.count({
        where: {
          userId,
          startDate: Between(startDate, endDate),
          status: AppointmentStatusEnum.CONFIRMED_SCHEDULE,
        },
      }),

      this.appointmentRepository.count({
        where: [
          {
            userId,
            startDate: Between(startDate, endDate),
            status: AppointmentStatusEnum.CANCELED,
          },
          {
            userId,
            startDate: Between(startDate, endDate),
            status: AppointmentStatusEnum.CANCELED_SCHEDULE,
          },
        ],
      }),
    ]);

    return {
      total,
      confirmed,
      canceled,
    };
  }

  private getPeriodRange(period: DashboardPeriodEnum = DashboardPeriodEnum.DAY) {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case DashboardPeriodEnum.WEEK:
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case DashboardPeriodEnum.MONTH:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case DashboardPeriodEnum.DAY:
      default:
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
    }

    return { startDate, endDate };
  }

  private getStatusFilter(status?: string): AppointmentStatusEnum[] {
    if (!status?.trim()) {
      return DEFAULT_DASHBOARD_STATUSES;
    }

    const validStatuses = new Set<string>(Object.values(AppointmentStatusEnum));

    const parsedStatuses = status
      .split(',')
      .map((value) => value.trim())
      .filter((value): value is AppointmentStatusEnum =>
        validStatuses.has(value),
      );

    return parsedStatuses.length > 0 ? parsedStatuses : DEFAULT_DASHBOARD_STATUSES;
  }
}
