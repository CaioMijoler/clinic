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
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
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

  @Post(':id/confirm-presence')
  @ApiBearerAuth()
  confirmPresenceByProfessional(@Req() req: Request, @Param('id') id: string) {
    return this.calendarService.confirmPresenceByProfessional(id, req?.user);
  }

  @Post(':id/mark-attendance')
  @ApiBearerAuth()
  markAttendance(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: MarkAttendanceDto,
  ) {
    return this.calendarService.markAttendance(id, body.attended, req?.user);
  }

  @Post(':id/notify-professional/confirm')
  @ApiBearerAuth()
  notifyProfessionalAppointmentConfirmed(
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    return this.calendarReminderService.notifyProfessionalAppointmentConfirmed(
      Number(id),
      req.user.id,
    );
  }

  @Post(':id/notify-professional/cancel')
  @ApiBearerAuth()
  notifyProfessionalAppointmentCanceled(
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    return this.calendarReminderService.notifyProfessionalAppointmentCanceled(
      Number(id),
      req.user.id,
    );
  }

  @Get('confirmation/:urlSafeToken')
  getConfirmationPreview(@Param('urlSafeToken') urlSafeToken: string) {
    return this.calendarService.getConfirmationPreview(urlSafeToken);
  }

  @Post('confirmation/:urlSafeToken/confirm')
  confirmAttendanceByLink(@Param('urlSafeToken') urlSafeToken: string) {
    return this.calendarService.confirmAttendanceByLink(urlSafeToken);
  }

  @Post('confirmation/:urlSafeToken/cancel')
  cancelAttendanceByLink(@Param('urlSafeToken') urlSafeToken: string) {
    return this.calendarService.cancelAttendanceByLink(urlSafeToken);
  }

  @Post(':appointmentId/confirm-attendance')
  async confirmAttendance(
    @Param('appointmentId') appointmentId: string,
    @Body() confirmDto: ConfirmAttendanceDto,
  ) {
    return this.calendarService.confirmAttendance(appointmentId, confirmDto.token);
  }

  @Post(':appointmentId/cancel-attendance')
  async cancelAttendance(
    @Param('appointmentId') appointmentId: string,
    @Body() cancelDto: CancelAttendanceDto,
  ) {
    return this.calendarService.cancelAttendance(appointmentId, cancelDto.token);
  }
}
