import { ApiProperty } from '@nestjs/swagger';

export class MedicalRecordDocumentResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  medicalRecordId: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  path: string;

  @ApiProperty()
  contentType: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
