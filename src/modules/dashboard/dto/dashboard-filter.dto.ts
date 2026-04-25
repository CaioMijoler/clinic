import { IsEnum, IsOptional } from 'class-validator';

export enum DashboardPeriodEnum {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export class DashboardFilterDto {
  @IsEnum(DashboardPeriodEnum)
  @IsOptional()
  period?: DashboardPeriodEnum = DashboardPeriodEnum.DAY;
}
