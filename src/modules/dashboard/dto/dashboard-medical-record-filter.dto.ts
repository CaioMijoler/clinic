import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DashboardPeriodEnum } from '../../../utils/enum/dashboard.enum';

export class DashboardMedicalRecordFilterDto {
  @ApiProperty({ required: false, enum: DashboardPeriodEnum, default: DashboardPeriodEnum.DAY })
  @IsEnum(DashboardPeriodEnum)
  @IsOptional()
  period?: DashboardPeriodEnum = DashboardPeriodEnum.DAY;

  @ApiProperty({
    required: false,
    description: 'Status únicos ou CSV. Ex: scheduled,confirmed_schedule,canceled_schedule',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => parseInt(value))
  current_page?: number = 1;

  @ApiProperty({ required: false, default: 5 })
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => parseInt(value))
  per_page?: number = 5;
}
