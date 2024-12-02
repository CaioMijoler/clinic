import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';
import { ErrorMessages } from '../../../utils/error-message';
import { FormatPhone } from '../../../utils/transform';

export class CreateClientDto {
  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Nome') })
  @MaxLength(50, { message: ErrorMessages['string.max']('Nome', 50) })
  name: string;

  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Documento') })
  @Transform(({ value }: TransformFnParams) => value?.replace(/[./-]/g, ''))
  @MaxLength(14, { message: ErrorMessages['string.max']('Documento', 14) })
  @IsOptional()
  document: string;

  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Endereço') })
  @MaxLength(255, { message: ErrorMessages['string.max']('Endereço', 255) })
  @IsOptional()
  address: string;

  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('IE/RG') })
  @MaxLength(20, { message: ErrorMessages['string.max']('IE/RG', 20) })
  @Transform(({ value }: TransformFnParams) => value?.replace(/[./-]/g, ''))
  @IsOptional()
  ieRg: string;

  @ApiProperty()
  @IsNotEmpty({ message: ErrorMessages['empty']('Email') })
  @IsEmail({}, { message: ErrorMessages['invalid']('Email') })
  email: string;

  @ApiProperty({ example: '16999999999' })
  @IsString({ message: ErrorMessages['string.base']('Telefone') })
  @MaxLength(30, { message: ErrorMessages['string.max']('Telefone', 30) })
  @FormatPhone()
  @IsOptional()
  telephone: string;
}
