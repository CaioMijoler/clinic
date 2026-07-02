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

  @ApiProperty({
    required: false,
    description: 'Filtro por campos. Ex: filter[name]=João&filter[status]=CREATED',
  })
  @IsOptional()
  @Transform(({ value, obj }: TransformFnParams) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, rawValue]) => [key, String(rawValue)]),
      );
    }

    if (!obj || typeof obj !== 'object') {
      return undefined;
    }

    const normalizedEntries = Object.entries(obj as Record<string, unknown>).flatMap(([key, rawValue]) => {
      if (typeof key === 'string' && key.startsWith('filter[') && key.endsWith(']')) {
        return [[key.slice(7, -1), String(rawValue)]];
      }

      return [];
    });

    if (!normalizedEntries.length) {
      return undefined;
    }

    return Object.fromEntries(normalizedEntries);
  })
  filter?: Record<string, string>;

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
