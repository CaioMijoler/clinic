import { ErrorMessages } from '../../utils/error-message';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateWhatsappDto {
  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Email') })
  @MaxLength(255, {
    message: ErrorMessages['string.max']('Email', 255),
  })
  to: string;

  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Texto') })
  @MaxLength(255, {
    message: ErrorMessages['string.max']('Texto', 255),
  })
  body: string;
}
