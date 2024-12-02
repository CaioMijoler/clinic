import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { ErrorMessages } from '../../../utils/error-message';

export class LoginDto {
  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Usuário') })
  username: string;

  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Senha') })
  password: string;
}
