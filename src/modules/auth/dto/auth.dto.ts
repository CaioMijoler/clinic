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

export class AuthResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  full_name: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  document: string;

  @ApiProperty({ required: false, nullable: true })
  avatarUrl?: string | null;

  @ApiProperty({ required: false, nullable: true })
  emailVerified?: boolean | Date | null;

  @ApiProperty({ required: false, type: [String] })
  roles?: string[];

  @ApiProperty({ required: false })
  accessToken?: string;

  @ApiProperty({ enum: ['admin', 'client'] })
  type: 'admin' | 'client';

  @ApiProperty({ enum: ['active', 'inactive'] })
  status: 'active' | 'inactive';

  @ApiProperty()
  telephone: string;

  @ApiProperty({ required: false })
  clientEmail?: string;

  @ApiProperty({ required: false })
  privateKey?: string;

  @ApiProperty({ required: false })
  calendarId?: string;

  @ApiProperty({ required: false })
  whatsAppToken?: string;

  @ApiProperty({ required: false })
  whatsAppId?: string;

  @ApiProperty({ required: false })
  supabaseId?: string;
}
