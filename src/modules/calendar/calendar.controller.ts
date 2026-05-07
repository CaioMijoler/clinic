import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CalendarService } from './calendar.service';
import { Request } from 'express';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { ConfirmAttendanceDto } from './dto/confirm-attendance.dto';
import { CancelAttendanceDto } from './dto/cancel-attendance.dto';
import { FilterCalendarDto } from './dto/filter-calendar.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResponseMedicalRecordResumeDto } from './dto/response-medical-record-resume.dto';

import { CalendarReminderService } from './services/calendar-reminder.service';

@ApiTags('calendar')
@Controller('v1/calendar')
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly calendarReminderService: CalendarReminderService,
    private readonly configService: ConfigService,
  ) {}

  @Get('cron/reminders')
  async triggerReminders(@Req() req: Request) {
    const authHeader = req.headers['authorization'];
    const cronSecret = this.configService.get<string>('cronSecret');
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      throw new BadRequestException('Unauthorized cron trigger');
    }

    await this.calendarReminderService.sendReminderMessages();
    return { success: true, message: 'Reminders triggered successfully' };
  }

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

  @Post(':medicalRecordId/confirm-attendance')
  async confirmAttendance(
    @Param('medicalRecordId') medicalRecordId: string,
    @Body() confirmDto: ConfirmAttendanceDto,
  ) {
    return this.calendarService.confirmAttendance(medicalRecordId, confirmDto.token);
  }

  @Post(':medicalRecordId/cancel-attendance')
  async cancelAttendance(
    @Param('medicalRecordId') medicalRecordId: string,
    @Body() cancelDto: CancelAttendanceDto,
  ) {
    return this.calendarService.cancelAttendance(medicalRecordId, cancelDto.token);
  }
}
