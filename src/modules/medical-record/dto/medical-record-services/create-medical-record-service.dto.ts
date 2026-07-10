import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { ErrorMessages } from '../../../../utils/error-message';

export class CreateMedicalRecordServiceItemDto {
  @ApiProperty()
  @IsNumber({}, { message: ErrorMessages['number.base']('Id do serviço') })
  serviceId: number;

  @ApiProperty()
  @IsNumber({}, { message: ErrorMessages['number.base']('Duração do serviço') })
  @Min(1, { message: 'A duração do serviço deve ser de pelo menos 1 minuto.' })
  durationMinutes: number;

  @ApiProperty()
  @IsNumber({}, { message: ErrorMessages['number.base']('Valor total') })
  @Min(0, { message: 'O valor total não pode ser negativo.' })
  totalValue: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean({ message: ErrorMessages['boolean.base']('Cortesia') })
  courtesy?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber({}, { message: ErrorMessages['number.base']('Desconto') })
  @Min(0, { message: 'O desconto não pode ser negativo.' })
  discount?: number;

  @ApiPropertyOptional({ default: 1, description: 'Quantidade de sessões deste serviço' })
  @IsOptional()
  @IsNumber({}, { message: ErrorMessages['number.base']('Quantidade de sessões') })
  @Min(1, { message: 'A quantidade de sessões deve ser de pelo menos 1.' })
  quantitySessions?: number;
}
