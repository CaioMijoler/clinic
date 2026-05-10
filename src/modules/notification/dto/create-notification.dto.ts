import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  medicalRecordId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  read?: boolean;
}
