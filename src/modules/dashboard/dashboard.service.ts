import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Not, Repository } from 'typeorm';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { MedicalRecord } from '../medical-record/entities/medical-record.entity';
import { User } from '../user/entities/user.entity';
import { MedicalRecordStatusEnum } from '../../utils/enum/medical-record.enum';

import { DashboardFilterDto } from './dto/dashboard-filter.dto';
import { DashboardMedicalRecordFilterDto } from './dto/dashboard-medical-record-filter.dto';
import { DashboardPeriodEnum } from '../../utils/enum/dashboard.enum';
import { TDashboardStatsResponse } from './dto/dashboard-response.dto';
import { IPaginate } from '../../utils/paginate';
import { MedicalRecordResponseDto } from '../medical-record/dto/create-medical-record.dto';

const DEFAULT_DASHBOARD_STATUSES = [
  MedicalRecordStatusEnum.SCHEDULED,
  MedicalRecordStatusEnum.CONFIRMED_SCHEDULE,
  MedicalRecordStatusEnum.CANCELED_SCHEDULE,
];

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepository: Repository<MedicalRecord>,
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
  ): Promise<IPaginate<MedicalRecordResponseDto>> {
    try {
      const currentPage = filter.current_page ?? 1;
      const perPage = filter.per_page ?? 5;
      const { startDate, endDate } = this.getPeriodRange(filter.period);
      const statuses = this.getStatusFilter(filter.status);

      const queryBuilder = this.medicalRecordRepository
        .createQueryBuilder('mr')
        .where('mr.userId = :userId', { userId: user.id })
        .andWhere('mr.startDate BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        .andWhere('mr.status IN (:...statuses)', { statuses })
        .orderBy('mr.startDate', 'ASC');

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
        data: data as MedicalRecordResponseDto[],
      };
    } catch (error) {
      throw new BadGatewayException(
        'Erro ao retornar prontuarios do dashboard',
        error.message,
      );
    }
  }

  private async getStatsForPeriod(startDate: Date, endDate: Date, userId: number) {
    const [total, confirmed, canceled] = await Promise.all([
      this.medicalRecordRepository.count({
        where: {
          userId,
          startDate: Between(startDate, endDate),
          status: Not(In([MedicalRecordStatusEnum.CANCELED, MedicalRecordStatusEnum.CANCELED_SCHEDULE])),
        },
      }),

      this.medicalRecordRepository.count({
        where: {
          userId,
          startDate: Between(startDate, endDate),
          status: MedicalRecordStatusEnum.CONFIRMED_SCHEDULE,
        },
      }),

      this.medicalRecordRepository.count({
        where: [
          {
            userId,
            startDate: Between(startDate, endDate),
            status: MedicalRecordStatusEnum.CANCELED,
          },
          {
            userId,
            startDate: Between(startDate, endDate),
            status: MedicalRecordStatusEnum.CANCELED_SCHEDULE,
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

  private getStatusFilter(status?: string) {
    if (!status?.trim()) {
      return DEFAULT_DASHBOARD_STATUSES;
    }

    return status
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }
}
