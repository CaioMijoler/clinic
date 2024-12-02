import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Req,
  Query,
} from '@nestjs/common';
import { MedicalRecordService } from './medical-record.service';
import {
  CreateMedicalRecordDto,
  MedicalRecordResponseDto,
} from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { Request } from 'express';
import { IPaginate } from '../../utils/paginate';
import { FilterDto } from '../../utils/filter-dto';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('medical-record')
@Controller('v1/medical-record')
@ApiBearerAuth()
export class MedicalRecordController {
  constructor(private readonly medicalRecordService: MedicalRecordService) {}

  @Post()
  @ApiOkResponse({
    type: MedicalRecordResponseDto,
  })
  async create(
    @Req() req: Request,
    @Body() createMedicalRecordDto: CreateMedicalRecordDto,
  ): Promise<MedicalRecordResponseDto> {
    return await this.medicalRecordService.create(
      createMedicalRecordDto,
      req?.user,
    );
  }

  @Get()
  @ApiOkResponse({
    type: MedicalRecordResponseDto,
    isArray: true,
  })
  async findAll(
    @Query() queryParams: FilterDto,
  ): Promise<IPaginate<MedicalRecordResponseDto> | MedicalRecordResponseDto[]> {
    return await this.medicalRecordService.findAll(queryParams);
  }

  @Get(':id')
  @ApiOkResponse({
    type: MedicalRecordResponseDto,
  })
  async findOne(@Param('id') id: number) {
    return await this.medicalRecordService.findOne(id);
  }

  @Put(':id')
  @ApiOkResponse({
    type: MedicalRecordResponseDto,
  })
  async update(
    @Param('id') id: number,
    @Req() req: Request,
    @Body() updateMedicalRecordDto: UpdateMedicalRecordDto,
  ): Promise<MedicalRecordResponseDto> {
    return await this.medicalRecordService.update(
      id,
      updateMedicalRecordDto,
      req?.user,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return await this.medicalRecordService.remove(id);
  }
}
