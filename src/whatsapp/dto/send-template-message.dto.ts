import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ErrorMessages } from '../../utils/error-message';

export class ButtonParameterDto {
  @ApiProperty()
  @IsNumber({}, { message: ErrorMessages['number.base']('Índice') })
  index: number;

  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Texto do Botão') })
  text: string;
}

export class SendTemplateMessageDto {
  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Telefone Destino') })
  to: string;

  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Nome do Template') })
  templateName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: ErrorMessages['string.base']('Código do Idioma') })
  languageCode?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray({ message: ErrorMessages['array.base']('Parâmetros do Corpo') })
  @IsString({ each: true, message: ErrorMessages['string.base']('Parâmetro do Corpo') })
  bodyParameters?: string[];

  @ApiPropertyOptional({ type: [ButtonParameterDto] })
  @IsOptional()
  @IsArray({ message: ErrorMessages['array.base']('Parâmetros do Botão') })
  @ValidateNested({ each: true })
  @Type(() => ButtonParameterDto)
  buttonParameters?: ButtonParameterDto[];
}
