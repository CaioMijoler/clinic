import { Module } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalRecord } from '../medical-record/entities/medical-record.entity';
import { MedicalRecordService } from '../medical-record/entities/medical-record-service.entity';
import { Service } from '../services/entities/service.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { WhatsappModule } from '../../whatsapp/whatsapp.module';
import { CalendarReminderService } from './services/calendar-reminder.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, MedicalRecord, MedicalRecordService, Service]),
    WhatsappModule,
    NotificationModule,
  ],
  controllers: [CalendarController],
  providers: [CalendarService, CalendarReminderService],
  exports: [CalendarReminderService],
})
export class CalendarModule {}
