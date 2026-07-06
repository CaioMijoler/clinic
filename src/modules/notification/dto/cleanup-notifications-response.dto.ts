import { ApiProperty } from '@nestjs/swagger';

export class CleanupNotificationsResponseDto {
  @ApiProperty({ example: 3 })
  deleted: number;
}
