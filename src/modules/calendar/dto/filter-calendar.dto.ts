import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class FilterCalendarDto {
  @ApiProperty()
  @IsOptional()
  start: string;

  @ApiProperty()
  @IsOptional()
  end: string;
}
