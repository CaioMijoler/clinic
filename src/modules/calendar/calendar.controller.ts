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
import { FilterCalendarDto } from './dto/filter-calendar.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

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
  findAll(@Req() req: Request, @Query() queryParams: FilterCalendarDto) {
    return this.calendarService.findAll(queryParams, req?.user);
  }

  @Delete(':id')
  @ApiBearerAuth()
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.calendarService.remove(id, req?.user);
  }
}
