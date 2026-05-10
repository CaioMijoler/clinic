import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNumber } from 'class-validator';

export class MarkAsReadNotificationDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  notificationIds: number[];
}
