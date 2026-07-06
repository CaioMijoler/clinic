import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthModule } from './modules/health/health.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';

import { AuthMiddleware } from './middleware/auth.middleware';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { ClientsModule } from './modules/clients/clients.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { TreatmentModule } from './modules/treatment/treatment.module';
import { PathologiesModule } from './modules/pathologies/pathologies.module';
import { MedicalRecordModule } from './modules/medical-record/medical-record.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CacheModule } from './cache/cache.module';
import { UploadModule } from './modules/upload/upload.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    DatabaseModule,
    HealthModule,
    AuthModule,
    UserModule,
    CalendarModule,
    ClientsModule,
    WhatsappModule,
    FeedbackModule,
    QuestionsModule,
    TreatmentModule,
    PathologiesModule,
    MedicalRecordModule,
    DashboardModule,
    CacheModule,
    UploadModule,
    NotificationModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware, AuthMiddleware)
      .exclude(
        'v1/auth/login',
        'health',
        {
          path: 'v1/user',
          method: RequestMethod.POST,
        },
        {
          path: 'v1/calendar/confirmation/:urlSafeToken',
          method: RequestMethod.GET,
        },
        {
          path: 'v1/calendar/confirmation/:urlSafeToken/confirm',
          method: RequestMethod.POST,
        },
        {
          path: 'v1/calendar/confirmation/:urlSafeToken/cancel',
          method: RequestMethod.POST,
        },
        {
          path: 'v1/calendar/:eventId/confirm-attendance',
          method: RequestMethod.POST,
        },
        {
          path: 'v1/calendar/:eventId/cancel-attendance',
          method: RequestMethod.POST,
        },
        {
          path: 'v1/calendar/cron/reminders',
          method: RequestMethod.GET,
        },
      )
      .forRoutes('*');
  }
}
