import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
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
  ): Promise<ResponseTreatmentDto> {
    return await this.treatmentService.create(createTreatmentDto);
  }

  @Get()
  async findAll(): Promise<ResponseTreatmentDto[]> {
    return await this.treatmentService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<ResponseTreatmentDto> {
    return await this.treatmentService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateTreatmentDto: UpdateTreatmentDto,
  ): Promise<ResponseTreatmentDto> {
    return await this.treatmentService.update(id, updateTreatmentDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return await this.treatmentService.remove(id);
  }
}
