import { Module } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalRecord } from '../medical-record/entities/medical-record.entity';
import { WhatsappModule } from '../../whatsapp/whatsapp.module';
import { CalendarReminderService } from './services/calendar-reminder.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalRecord]), WhatsappModule, NotificationModule],
  controllers: [CalendarController],
  providers: [CalendarService, CalendarReminderService],
  exports: [CalendarReminderService],
})
export class CalendarModule {}
