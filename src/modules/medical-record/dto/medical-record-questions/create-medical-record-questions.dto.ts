import { ErrorMessages } from '../../../../utils/error-message';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateMedicalRecordQuestionsDto {
  @ApiProperty()
  @IsNumber({}, { message: ErrorMessages['number.base']('Id da pergunta') })
  questionId: number;
}

export class ResponseQuestionsDto {
  @ApiProperty()
  questionId: number;

  @ApiProperty()
  medicalRecordId: number;
}
