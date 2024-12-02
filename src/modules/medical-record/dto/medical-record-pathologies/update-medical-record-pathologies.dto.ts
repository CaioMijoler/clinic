import { PartialType } from '@nestjs/swagger';
import { CreateMedicalRecordPathologyDto } from './create-medical-record-pathologies.dto';

export class UpdateMedicalRecordPathologyDto extends PartialType(
  CreateMedicalRecordPathologyDto,
) {}
