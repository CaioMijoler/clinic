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
  ParseIntPipe,
} from '@nestjs/common';
import { CalendarReminderService } from '../calendar/services/calendar-reminder.service';
import { SendTemplateMessageDto } from '../../whatsapp/dto/send-template-message.dto';
import { MedicalRecordService } from './medical-record.service';
import {
  CreateMedicalRecordDto,
  MedicalRecordResponseDto,
} from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { Request } from 'express';
import { IPaginate } from '../../utils/paginate';
import { FilterDto } from '../../utils/filter-dto';
import { MedicalRecordDocumentResponseDto } from './dto/medical-record-documents/medical-record-documents-response.dto';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('medical-record')
@Controller('v1/medical-records')
@ApiBearerAuth()
export class MedicalRecordController {
  constructor(
    private readonly medicalRecordService: MedicalRecordService,
    private readonly calendarReminderService: CalendarReminderService,
  ) {}

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
    @Req() req: Request,
    @Query() queryParams: FilterDto,
  ): Promise<IPaginate<MedicalRecordResponseDto> | MedicalRecordResponseDto[]> {
    return await this.medicalRecordService.findAll(queryParams, req.user as any);
  }

  @Get('client/:clientId')
  @ApiOkResponse({
    type: MedicalRecordResponseDto,
    isArray: true,
  })
  async findByClient(
    @Param('clientId', ParseIntPipe) clientId: number,
    @Query() queryParams: FilterDto,
  ): Promise<IPaginate<MedicalRecordResponseDto> | MedicalRecordResponseDto[]> {
    return await this.medicalRecordService.findByClient(clientId, queryParams);
  }

  @Get('documents/:id')
  @ApiOkResponse({
    type: MedicalRecordDocumentResponseDto,
    isArray: true,
  })
  async findDocuments(
    @Param('id', ParseIntPipe) id: number,
    @Query() queryParams: FilterDto,
  ): Promise<IPaginate<MedicalRecordDocumentResponseDto> | MedicalRecordDocumentResponseDto[]> {
    return await this.medicalRecordService.findDocuments(id, queryParams);
  }

  @Get(':id/whatsapp-reminder-payload')
  @ApiOkResponse({ description: 'Payload para envio manual de lembrete via WhatsApp' })
  async getWhatsappReminderPayload(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<SendTemplateMessageDto> {
    return this.calendarReminderService.getReminderPayloadForMedicalRecord(
      id,
      req.user.id,
    );
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
