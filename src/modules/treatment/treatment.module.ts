import { Module } from '@nestjs/common';
import { TreatmentService } from './treatment.service';
import { TreatmentController } from './treatment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Treatment } from './entities/treatment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Treatment])],
  controllers: [TreatmentController],
  providers: [TreatmentService],
})
export class TreatmentModule {}
