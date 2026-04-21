import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ErrorMessages } from '../../../utils/error-message';

class DateStartAndEnd {
  @ApiProperty()
  @IsNotEmpty({ message: ErrorMessages['empty']('Data') })
  @IsString({ message: ErrorMessages['string.base']('Data') })
  dateTime: string;

  @ApiProperty({ example: 'America/Sao_Paulo' })
  @IsString({ message: ErrorMessages['string.base']('Timezone') })
  @IsOptional()
  timezone: string;
}

export class CreateCalendarDto {
  @ApiProperty()
  @IsNumber({}, { message: ErrorMessages['string.base']('Id do prontuário') })
  @IsOptional()
  medicalRecordId?: number;

  @ApiProperty()
  @IsNumber({}, { message: ErrorMessages['string.base']('Id do paciente') })
  @IsNotEmpty({ message: ErrorMessages['empty']('Id do paciente') })
  clientId: number;

  @ApiProperty()
  @IsNotEmpty({ message: ErrorMessages['empty']('Tipo') })
  @IsString({ message: ErrorMessages['string.base']('Título do agendamento') })
  summary: string;

  @ApiProperty()
  @IsString({
    message: ErrorMessages['string.base']('Descrição do agendamento'),
  })
  description: string;

  @ApiProperty()
  @Type(() => DateStartAndEnd)
  @IsDefined({ message: ErrorMessages['empty']('Data de inicio') })
  @ValidateNested()
  start: DateStartAndEnd;

  @ApiProperty()
  @IsNotEmpty({
    message: ErrorMessages['empty']('Data de termino do agendamento'),
  })
  end: DateStartAndEnd;
}
