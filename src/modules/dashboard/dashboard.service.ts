import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Not, Repository } from 'typeorm';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { MedicalRecord } from '../medical-record/entities/medical-record.entity';
import { User } from '../user/entities/user.entity';
import { MedicalRecordStatusEnum } from '../../utils/enum/medical-record.enum';

import { DashboardFilterDto } from './dto/dashboard-filter.dto';
import { DashboardPeriodEnum } from '../../utils/enum/dashboard.enum';
import { TDashboardStatsResponse } from './dto/dashboard-response.dto';
@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepository: Repository<MedicalRecord>,
  ) {}

  async getStatistics(user: User, filter: DashboardFilterDto): Promise<TDashboardStatsResponse> {
    try {
      const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (filter.period) {
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

    return this.getStatsForPeriod(startDate, endDate, user.id);
    } catch (error) {
     throw new BadGatewayException('Erro ao retornoar dados do dashboard', error.message);
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
}
