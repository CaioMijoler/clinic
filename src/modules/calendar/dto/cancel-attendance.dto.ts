import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { ErrorMessages } from '../../../utils/error-message';

export class CancelAttendanceDto {
  @ApiProperty({ example: 'token-unico-123456' })
  @IsString({ message: ErrorMessages['string.base']('Token') })
  @IsNotEmpty({ message: ErrorMessages['empty']('Token') })
  token: string;
}
