import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { MedicalRecord } from '../medical-record/entities/medical-record.entity';
import { User } from '../user/entities/user.entity';
import { MedicalRecordStatusEnum } from '../../utils/enum/medical-record.enum';
import { AttendanceStatusEnum } from '../../utils/enum/attendance.enum';

import { DashboardFilterDto, DashboardPeriodEnum } from './dto/dashboard-filter.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepository: Repository<MedicalRecord>,
  ) {}

  async getStatistics(user: User, filter: DashboardFilterDto) {
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
  }

  private async getStatsForPeriod(startDate: Date, endDate: Date, userId: number) {
    const [total, confirmed, canceled] = await Promise.all([
      this.medicalRecordRepository.count({
        where: {
          userId,
          startDate: Between(startDate, endDate),
        },
      }),

      this.medicalRecordRepository.count({
        where: {
          userId,
          startDate: Between(startDate, endDate),
          attendanceStatus: AttendanceStatusEnum.CONFIRMED,
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
