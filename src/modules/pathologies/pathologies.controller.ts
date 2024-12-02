import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
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
  ): Promise<ResponsePathologyDto> {
    return await this.pathologiesService.create(createPathologyDto);
  }

  @Get()
  async findAll(
    @Query() queryParams: FilterDto,
  ): Promise<IPaginate<ResponsePathologyDto> | ResponsePathologyDto[]> {
    return await this.pathologiesService.findAll(queryParams);
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<ResponsePathologyDto> {
    return await this.pathologiesService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updatePathologyDto: UpdatePathologyDto,
  ): Promise<ResponsePathologyDto> {
    return await this.pathologiesService.update(id, updatePathologyDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return await this.pathologiesService.remove(id);
  }
}
