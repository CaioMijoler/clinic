import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { HealthModule } from './modules/health/health.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';

import { AuthMiddleware } from './middleware/auth.middleware';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { CalendarModule } from './modules/calendar/calendar.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { ClientsModule } from './modules/clients/clients.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { TreatmentModule } from './modules/treatment/treatment.module';
import { PathologiesModule } from './modules/pathologies/pathologies.module';
import { MedicalRecordModule } from './modules/medical-record/medical-record.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      secret: 'clinical',
      signOptions: {
        expiresIn: 86000,
      },
    }),
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
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware, AuthMiddleware)
      .exclude('v1/auth/login', 'health', {
        path: 'v1/user',
        method: RequestMethod.POST,
      })
      .forRoutes('*');
  }
}
