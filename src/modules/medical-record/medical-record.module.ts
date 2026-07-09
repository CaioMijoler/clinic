import { Module } from '@nestjs/common';
import { MedicalRecordService } from './medical-record.service';
import { MedicalRecordController } from './medical-record.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalRecord } from './entities/medical-record.entity';
import { MedicalRecordDocument } from './entities/medical-record-documents.entity';
import { MedicalRecordService as MedicalRecordServiceEntity } from './entities/medical-record-service.entity';
import { Service } from '../services/entities/service.entity';
import { CalendarModule } from '../calendar/calendar.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MedicalRecord,
      MedicalRecordDocument,
      MedicalRecordServiceEntity,
      Service,
    ]),
    CalendarModule,
  ],
  controllers: [MedicalRecordController],
  providers: [MedicalRecordService],
})
export class MedicalRecordModule {}
