import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  CreateTreatmentDto,
  ResponseTreatmentDto,
} from './dto/create-treatment.dto';
import { UpdateTreatmentDto } from './dto/update-treatment.dto';
import { Repository } from 'typeorm';
import { Treatment } from './entities/treatment.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TreatmentService {
  constructor(
    @InjectRepository(Treatment)
    private readonly treatmentRepository: Repository<Treatment>,
  ) {}

  async create(
    createTreatmentDto: CreateTreatmentDto,
  ): Promise<ResponseTreatmentDto> {
    try {
      return await this.treatmentRepository.save(createTreatmentDto);
    } catch (error) {
      const message = 'Ocorreu um erro ao criar o tratamento.';

      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(message, error?.stack ?? error.message);

      throw new BadRequestException(message);
    }
  }

  async findAll(): Promise<ResponseTreatmentDto[]> {
    return await this.treatmentRepository.find();
  }

  async findOne(id: number): Promise<ResponseTreatmentDto> {
    return await this.treatmentRepository.findOne({ where: { id } });
  }

  async update(
    id: number,
    updateTreatmentDto: UpdateTreatmentDto,
  ): Promise<ResponseTreatmentDto> {
    try {
      let treatment = await this.treatmentRepository.findOne({
        where: { id },
      });

      if (!treatment) {
        throw new BadRequestException(
          'Não conseguimos encontrar o tratamento.',
        );
      }

      treatment = {
        ...treatment,
        ...updateTreatmentDto,
      };

      return await this.treatmentRepository.save(treatment);
    } catch (error) {
      const message = 'Ocorreu um erro ao atualizar o tratamento.';

      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(message, error?.stack ?? error.message);

      throw new BadRequestException(message);
    }
  }

  async remove(id: number) {
    try {
      const treatment = await this.treatmentRepository.findOne({
        where: { id },
      });

      if (!treatment) {
        throw new BadRequestException(
          'Não conseguimos encontrar o tratamento, tente novamente!',
        );
      }

      await this.treatmentRepository.remove(treatment);
    } catch (error) {
      const message = 'Ocorreu um erro ao remover o tratamento.';

      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(message, error?.stack ?? error.message);

      throw new BadRequestException(message);
    }
  }
}
