import { ApiProperty } from '@nestjs/swagger';

class MedicalRecordResumeDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  status: string;
}

export class ResponseMedicalRecordResumeDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  start: { dateTime: string; timeZone: string };

  @ApiProperty()
  end: { dateTime: string; timeZone: string };

  @ApiProperty()
  status: string;

  @ApiProperty()
  summary: string;

  @ApiProperty({ required: false })
  link?: string;

  @ApiProperty({ type: MedicalRecordResumeDto, nullable: true })
  medicalRecord: MedicalRecordResumeDto | null;
}