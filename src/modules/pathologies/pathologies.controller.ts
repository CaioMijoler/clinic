import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { PathologiesService } from './pathologies.service';
import {
  CreatePathologyDto,
  ResponsePathologyDto,
} from './dto/create-pathology.dto';
import { UpdatePathologyDto } from './dto/update-pathology.dto';
import { IPaginate } from '../../utils/paginate';
import { FilterDto } from '../../utils/filter-dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('pathologies')
@Controller('v1/pathologies')
@ApiBearerAuth()
export class PathologiesController {
  constructor(private readonly pathologiesService: PathologiesService) {}

  @Post()
  async create(
    @Body() createPathologyDto: CreatePathologyDto,
    @Req() req: Request,
  ): Promise<ResponsePathologyDto> {
    return await this.pathologiesService.create(
      createPathologyDto,
      req?.user as any,
    );
  }

  @Get()
  async findAll(
    @Query() queryParams: FilterDto,
    @Req() req: Request,
  ): Promise<IPaginate<ResponsePathologyDto> | ResponsePathologyDto[]> {
    return await this.pathologiesService.findAll(
      queryParams,
      req?.user as any,
    );
  }

  @Get(':id')
  async findOne(
    @Param('id') id: number,
    @Req() req: Request,
  ): Promise<ResponsePathologyDto> {
    return await this.pathologiesService.findOne(id, req?.user as any);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updatePathologyDto: UpdatePathologyDto,
    @Req() req: Request,
  ): Promise<ResponsePathologyDto> {
    return await this.pathologiesService.update(
      id,
      updatePathologyDto,
      req?.user as any,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @Req() req: Request) {
    return await this.pathologiesService.remove(id, req?.user as any);
  }
}
