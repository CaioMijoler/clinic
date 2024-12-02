import { Module } from '@nestjs/common';
import { PathologiesService } from './pathologies.service';
import { PathologiesController } from './pathologies.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pathology } from './entities/pathology.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pathology])],
  controllers: [PathologiesController],
  providers: [PathologiesService],
})
export class PathologiesModule {}
