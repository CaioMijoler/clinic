import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { MedicalRecord } from '../medical-record/entities/medical-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalRecord])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
