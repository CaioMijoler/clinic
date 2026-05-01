import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalRecord } from '../medical-record/entities/medical-record.entity';
import { MedicalRecordDocument } from '../medical-record/entities/medical-record-documents.entity';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([MedicalRecord, MedicalRecordDocument]),
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
