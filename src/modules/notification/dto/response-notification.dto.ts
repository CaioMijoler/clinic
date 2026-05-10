import { ApiProperty } from '@nestjs/swagger';

export class ResponseNotificationDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  description: string;

  @ApiProperty()
  medicalRecordId: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  read: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
