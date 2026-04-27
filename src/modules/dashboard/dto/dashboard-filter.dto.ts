import { IsEnum, IsOptional } from 'class-validator';
import { DashboardPeriodEnum } from '../../../utils/enum/dashboard.enum';

export class DashboardFilterDto {
  @IsEnum(DashboardPeriodEnum)
  @IsOptional()
  period?: DashboardPeriodEnum = DashboardPeriodEnum.DAY;
}
