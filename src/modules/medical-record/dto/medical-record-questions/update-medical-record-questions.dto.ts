import { PartialType } from '@nestjs/swagger';
import { CreateMedicalRecordQuestionsDto } from './create-medical-record-questions.dto';

export class UpdateMedicalRecordQuestionsDto extends PartialType(
  CreateMedicalRecordQuestionsDto,
) {}
