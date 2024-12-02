import { ErrorMessages } from '../../../utils/error-message';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTreatmentDto {
  @ApiProperty()
  @IsString({
    message: ErrorMessages['string.base']('Descrição do tratamento'),
  })
  @MaxLength(255, {
    message: ErrorMessages['string.max']('Descrição do tratamento', 255),
  })
  description: string;

  @ApiProperty()
  @IsNumber(
    {},
    { message: ErrorMessages['number.base']('Id do prontuário do tratamento') },
  )
  @IsOptional()
  medicalRecordId: number;
}

export class ResponseTreatmentDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  description: string;

  @ApiProperty()
  medicalRecordId: number;
}
