import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ErrorMessages } from '../../../utils/error-message';

export class CreateServiceDto {
  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Nome') })
  @MaxLength(255, { message: ErrorMessages['string.max']('Nome', 255) })
  name: string;

  @ApiProperty({ default: true })
  @IsBoolean({ message: ErrorMessages['boolean.base']('Ativo') })
  @IsOptional()
  active?: boolean;

  @ApiProperty({ description: 'Tempo padrão de execução em minutos' })
  @IsInt({ message: ErrorMessages['number.base']('Duração') })
  @Min(1, { message: 'A duração deve ser de pelo menos 1 minuto.' })
  durationMinutes: number;

  @ApiProperty({ description: 'Valor padrão do serviço' })
  @IsNumber({}, { message: ErrorMessages['number.base']('Valor') })
  @Min(0, { message: 'O valor não pode ser negativo.' })
  price: number;
}

export class ResponseServiceDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  durationMinutes: number;

  @ApiProperty()
  price: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
