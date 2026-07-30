import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { TreatmentService } from './treatment.service';
import {
  CreateTreatmentDto,
  ResponseTreatmentDto,
} from './dto/create-treatment.dto';
import { UpdateTreatmentDto } from './dto/update-treatment.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('treatment')
@Controller('v1/treatment')
@ApiBearerAuth()
export class TreatmentController {
  constructor(private readonly treatmentService: TreatmentService) {}

  @Post()
  async create(
    @Body() createTreatmentDto: CreateTreatmentDto,
    @Req() req: Request,
  ): Promise<ResponseTreatmentDto> {
    return await this.treatmentService.create(
      createTreatmentDto,
      req?.user as any,
    );
  }

  @Get()
  async findAll(@Req() req: Request): Promise<ResponseTreatmentDto[]> {
    return await this.treatmentService.findAll(req?.user as any);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: number,
    @Req() req: Request,
  ): Promise<ResponseTreatmentDto> {
    return await this.treatmentService.findOne(id, req?.user as any);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateTreatmentDto: UpdateTreatmentDto,
    @Req() req: Request,
  ): Promise<ResponseTreatmentDto> {
    return await this.treatmentService.update(
      id,
      updateTreatmentDto,
      req?.user as any,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @Req() req: Request) {
    return await this.treatmentService.remove(id, req?.user as any);
  }
}
