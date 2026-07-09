import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
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

export class CreateCalendarServiceItemDto {
  @ApiProperty()
  @IsNumber({}, { message: ErrorMessages['number.base']('Id do serviço') })
  serviceId: number;

  @ApiProperty({ description: 'Duração do serviço no agendamento em minutos' })
  @IsNumber({}, { message: ErrorMessages['number.base']('Duração do serviço') })
  @Min(1, { message: 'A duração do serviço deve ser de pelo menos 1 minuto.' })
  durationMinutes: number;

  @ApiProperty({ description: 'Valor total do serviço no agendamento' })
  @IsNumber({}, { message: ErrorMessages['number.base']('Valor total') })
  @Min(0, { message: 'O valor total não pode ser negativo.' })
  totalValue: number;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean({ message: ErrorMessages['boolean.base']('Cortesia') })
  courtesy?: boolean;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsNumber({}, { message: ErrorMessages['number.base']('Desconto') })
  @Min(0, { message: 'O desconto não pode ser negativo.' })
  discount?: number;
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

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean({ message: ErrorMessages['boolean.base']('Envio de confirmação por WhatsApp') })
  sendWhatsAppConfirmation?: boolean;

  @ApiProperty({ type: [CreateCalendarServiceItemDto] })
  @IsArray({ message: 'Informe ao menos um serviço para o agendamento.' })
  @ArrayMinSize(1, { message: 'Informe ao menos um serviço para o agendamento.' })
  @ValidateNested({ each: true })
  @Type(() => CreateCalendarServiceItemDto)
  services: CreateCalendarServiceItemDto[];

  @ApiProperty({
    required: false,
    description: 'Duração total do agendamento em minutos',
  })
  @IsOptional()
  @IsNumber({}, { message: ErrorMessages['number.base']('Duração total') })
  @Min(1, { message: 'A duração total deve ser de pelo menos 1 minuto.' })
  durationMinutes?: number;

  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Valor total do prontuário/agendamento',
  })
  @IsOptional()
  @IsNumber({}, { message: ErrorMessages['number.base']('Valor total do prontuário') })
  @Min(0, { message: 'O valor total do prontuário não pode ser negativo.' })
  totalValue?: number | null;
}
