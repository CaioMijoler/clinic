import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ErrorMessages } from '../../../utils/error-message';

export class CreateOrderDto {
  @ApiProperty()
  @IsNumber({}, { message: ErrorMessages['number.base']('Id do prontuário') })
  medicalRecordId: number;

  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Id do google calendar') })
  @IsOptional()
  calendarGoogleId: string;

  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Data de Inicio') })
  startDate?: string;

  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Data de Término]') })
  endDate?: string;

  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Data de agendamento') })
  title?: string;
}
