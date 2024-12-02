import { ErrorMessages } from '../../../../utils/error-message';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateMedicalRecordPathologyDto {
  @ApiProperty()
  @IsNumber({}, { message: ErrorMessages['number.base']('Id da patologia') })
  pathologiesId: number;
}

export class ResponseQuestionsDto {
  @ApiProperty()
  pathologyId: number;

  @ApiProperty()
  medicalRecordId: number;
}
