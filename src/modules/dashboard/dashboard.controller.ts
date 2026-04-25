import { Controller, Get, Req, Query } from '@nestjs/common';
import { Request } from 'express';
import { DashboardService } from './dashboard.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';

@ApiTags('dashboard')
@Controller('v1/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiBearerAuth()
  getStatistics(@Req() req: Request, @Query() filter: DashboardFilterDto) {
    return this.dashboardService.getStatistics(req?.user, filter);
  }
}
