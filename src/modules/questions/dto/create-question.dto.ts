import { ErrorMessages } from '../../../utils/error-message';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateQuestionDto {
  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Nome') })
  @MaxLength(255, { message: ErrorMessages['string.max']('Nome', 255) })
  name: string;

  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Resposta') })
  @MaxLength(500, { message: ErrorMessages['string.max']('Resposta', 500) })
  @IsOptional()
  response: string;
}

export class ResponseQuestionDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  response: string;

  @ApiProperty({
    example: 1,
    nullable: true,
    description: 'Profissional dono do registro.',
  })
  userId?: number;
}
