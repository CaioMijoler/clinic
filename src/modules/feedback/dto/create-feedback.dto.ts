import { ErrorMessages } from '../../../utils/error-message';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateFeedbackDto {
  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Descrição') })
  @MaxLength(255, { message: ErrorMessages['string.max']('Descrição', 255) })
  description: string;
}

export class FeedBackResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'Muito bom!' })
  description: string;

  @ApiProperty({ example: 1 })
  medicalRecordId: number;
}
