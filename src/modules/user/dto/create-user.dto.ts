import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsNotEmpty,
  IsJSON,
} from 'class-validator';
import { ErrorMessages } from '../../../utils/error-message';
import { FormatPhone } from '../../../utils/transform';

export class CreateUserDto {
  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Nome') })
  @IsOptional()
  name: string;

  @ApiProperty()
  @IsNotEmpty({ message: ErrorMessages['empty']('Senha') })
  @IsString({ message: ErrorMessages['string.base']('Senha') })
  password: string;

  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Tipo de usuário') })
  @IsOptional()
  type: string;

  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('CPF') })
  @IsOptional()
  document: string;

  @ApiProperty()
  @IsNotEmpty({ message: ErrorMessages['empty']('Email') })
  @IsEmail({}, { message: ErrorMessages['invalid']('Email') })
  email: string;

  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Status') })
  @IsOptional()
  status: string;

  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Email Cliente google agenda') })
  @IsOptional()
  clientEmail: string;

  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Private key google agenda') })
  @IsOptional()
  privateKey: string;

  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Agenda Google Id') })
  @IsOptional()
  calendarId: string;

  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('WhatsApp Token') })
  @IsOptional()
  whatsAppToken: string;

  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('WhatsApp Id') })
  @IsOptional()
  whatsAppId: string;

  @ApiProperty()
  @IsNotEmpty({ message: ErrorMessages['empty']('Telefone') })
  @IsString({ message: ErrorMessages['string.base']('Telefone') })
  @FormatPhone()
  telephone: string;

  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('token') })
  @IsOptional()
  token: string;
}
