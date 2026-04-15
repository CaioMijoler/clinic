import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { FilterPagination } from '../utils/paginate';

export class FilterDto implements FilterPagination {
  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => value === 'true')
  paginate?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => parseInt(value))
  current_page?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => parseInt(value))
  per_page?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  filter?: string;

  @ApiProperty({ required: false })
  fields?: string;

  @ApiProperty({ required: false })
  sort?: string;

  @ApiProperty({ required: false })
  relations?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => parseInt(value))
  limit?: number;

  /**
   * Termo de busca livre (OR LIKE em múltiplos campos).
   * Exemplo: search=João
   */
  @ApiProperty({
    required: false,
    description: 'Termo de busca livre. Use junto com search_fields.',
    example: 'João',
  })
  @IsOptional()
  search?: string;

  /**
   * Campos onde o search será aplicado (CSV).
   * Exemplo: search_fields=name,document
   */
  @ApiProperty({
    required: false,
    description:
      'Campos onde aplicar o search (CSV). Ex: name,document',
    example: 'name,document',
  })
  @IsOptional()
  search_fields?: string;
}
