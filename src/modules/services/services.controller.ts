import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { FilterDto } from '../../utils/filter-dto';
import { IPaginate } from '../../utils/paginate';
import { CreateServiceDto, ResponseServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

@ApiTags('services')
@Controller('v1/services')
@ApiBearerAuth()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  async create(@Body() createServiceDto: CreateServiceDto, @Req() req: Request) {
    return await this.servicesService.create(createServiceDto, req?.user as any);
  }

  @Get()
  async findAll(
    @Query() queryParams: FilterDto,
    @Req() req: Request,
  ): Promise<IPaginate<ResponseServiceDto> | ResponseServiceDto[]> {
    return await this.servicesService.findAll(queryParams, req?.user as any);
  }

  @Get(':id')
  async findOne(@Param('id') id: number, @Req() req: Request) {
    return await this.servicesService.findOne(id, req?.user as any);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateServiceDto: UpdateServiceDto,
    @Req() req: Request,
  ) {
    return await this.servicesService.update(id, updateServiceDto, req?.user as any);
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @Req() req: Request) {
    return await this.servicesService.remove(id, req?.user as any);
  }
}
