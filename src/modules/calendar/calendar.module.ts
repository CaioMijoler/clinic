import { Module } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalRecord } from '../medical-record/entities/medical-record.entity';
import { WhatsappModule } from '../../whatsapp/whatsapp.module';
import { CalendarReminderService } from './services/calendar-reminder.service';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalRecord]), WhatsappModule],
  controllers: [CalendarController],
  providers: [CalendarService, CalendarReminderService],
})
export class CalendarModule {}
