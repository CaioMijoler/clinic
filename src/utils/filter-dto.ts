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
}
