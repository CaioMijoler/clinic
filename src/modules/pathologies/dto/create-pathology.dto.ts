import { ErrorMessages } from '../../../utils/error-message';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreatePathologyDto {
  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Código patologia') })
  @Length(1, 120, {
    message: ErrorMessages['length']('Código patologia', 1, 120),
  })
  code: string;

  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Descrição patologia') })
  @Length(1, 255, {
    message: ErrorMessages['length']('Descrição patologia', 1, 255),
  })
  description: string;
}

export class ResponsePathologyDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  description: string;

  @ApiProperty({
    example: 1,
    nullable: true,
    description: 'Profissional dono do registro.',
  })
  userId?: number;
}
