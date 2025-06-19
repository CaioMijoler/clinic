import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsNotEmpty,
  MaxLength,
  Length,
  IsObject,
} from 'class-validator';
import { Transform, TransformFnParams } from 'class-transformer';
import { ErrorMessages } from '../../../utils/error-message';
import { FormatPhone } from '../../../utils/transform';

export class CreateClientOrUpdateAddressDto {
  @ApiProperty({ example: '69084080' })
  @IsString({ message: ErrorMessages['string.base']('CEP') })
  @Length(8, 8, { message: ErrorMessages['length']('CEP', 8, 8) })
  zipCode: string;

  @ApiProperty({ example: 'Av. Brigadeiro Faria Lima' })
  @IsString({ message: ErrorMessages['string.base']('Rua') })
  @Length(1, 70, { message: ErrorMessages['length']('Rua', 1, 70) })
  street: string;

  @ApiProperty({ example: '1811' })
  @IsString({ message: ErrorMessages['string.base']('Número') })
  @Length(1, 20, { message: ErrorMessages['length']('Número', 1, 10) })
  number: string;

  @ApiProperty({ example: 'Bloco 1 Apto 27' })
  @IsString({ message: ErrorMessages['string.base']('Complemento') })
  @Length(1, 50, { message: ErrorMessages['length']('Complemento', 1, 50) })
  complement: string;

  @ApiProperty({ example: 'Pinheiros' })
  @IsString({ message: ErrorMessages['string.base']('Bairro') })
  @Length(1, 50, { message: ErrorMessages['length']('Bairro', 1, 50) })
  neighborhood: string;

  @ApiProperty({ example: 'Sao Paulo' })
  @IsString({ message: ErrorMessages['string.base']('Cidade') })
  @Length(1, 50, { message: ErrorMessages['length']('Cidade', 1, 50) })
  city: string;

  @ApiProperty({ example: 'SP' })
  @IsString({ message: ErrorMessages['string.base']('Estado') })
  @Length(2, 2, { message: ErrorMessages['length']('Estado', 2, 2) })
  state: string;
}

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

  @ApiProperty({ type: () => CreateClientOrUpdateAddressDto })
  @IsNotEmpty({ message: ErrorMessages['empty']('Endereço') })
  @IsObject({ message: ErrorMessages['object.base']('Endereço') })
  clientAddress: CreateClientOrUpdateAddressDto;
}
