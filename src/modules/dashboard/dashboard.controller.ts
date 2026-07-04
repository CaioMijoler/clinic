import { Controller, Get, Req, Query } from '@nestjs/common';
import { Request } from 'express';
import { DashboardService } from './dashboard.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';
import { DashboardMedicalRecordFilterDto } from './dto/dashboard-medical-record-filter.dto';
import { TDashboardStatsResponse } from './dto/dashboard-response.dto';
import { MedicalRecordResponseDto } from '../medical-record/dto/create-medical-record.dto';
import { IPaginate } from '../../utils/paginate';

@ApiTags('dashboard')
@Controller('v1/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiBearerAuth()
  getStatistics(@Req() req: Request, @Query() filter: DashboardFilterDto): Promise<TDashboardStatsResponse> {
    return this.dashboardService.getStatistics(req?.user, filter);
  }

  @Get('medical-records')
  @ApiBearerAuth()
  getMedicalRecords(
    @Req() req: Request,
    @Query() filter: DashboardMedicalRecordFilterDto,
  ): Promise<IPaginate<MedicalRecordResponseDto>> {
    return this.dashboardService.getMedicalRecords(req?.user, filter);
  }
}
