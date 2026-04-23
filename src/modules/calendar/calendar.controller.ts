import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { Request } from 'express';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { ConfirmAttendanceDto } from './dto/confirm-attendance.dto';
import { FilterCalendarDto } from './dto/filter-calendar.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResponseMedicalRecordResumeDto } from './dto/response-medical-record-resume.dto';

@ApiTags('calendar')
@Controller('v1/calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  @ApiBearerAuth()
  create(@Req() req: Request, @Body() createCalendarDto: CreateCalendarDto) {
    return this.calendarService.create(createCalendarDto, req?.user);
  }

  @Get()
  @ApiBearerAuth()
  findAll(@Req() req: Request, @Query() queryParams: FilterCalendarDto):Promise<ResponseMedicalRecordResumeDto[]> {
    return this.calendarService.findAll(queryParams, req?.user);
  }

  @Delete(':id')
  @ApiBearerAuth()
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.calendarService.remove(id, req?.user);
  }

  @Post(':eventId/confirm-attendance')
  async confirmAttendance(
    @Param('eventId') eventId: string,
    @Body() confirmDto: ConfirmAttendanceDto,
  ) {
    return this.calendarService.confirmAttendance(eventId, confirmDto.token);
  }

  @Get(':eventId/confirmation-link')
  @ApiBearerAuth()
  async getConfirmationLink(@Param('eventId') eventId: string) {
    const token = await this.calendarService.generateConfirmationToken(eventId);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const confirmationUrl = `${frontendUrl}/confirmar-presenca/${eventId}/${token}`;

    return {
      url: confirmationUrl,
      token,
    };
  }
}
