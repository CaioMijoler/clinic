import { ApiProperty } from '@nestjs/swagger';

export class DashboardAppointmentResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  medicalRecordId: number;

  @ApiProperty()
  symptoms: string;

  @ApiProperty()
  clinicalExam: string;

  @ApiProperty()
  completeClinicalExam: string;

  @ApiProperty()
  conclusion: string;

  @ApiProperty()
  clientId: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  status: string;

  @ApiProperty({ required: false })
  medicalRecordStatus?: string;

  @ApiProperty({ required: false })
  startDate?: Date;

  @ApiProperty({ required: false })
  endDate?: Date;

  @ApiProperty({ required: false })
  title?: string;

  @ApiProperty({ required: false, nullable: true })
  totalValue?: number | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
