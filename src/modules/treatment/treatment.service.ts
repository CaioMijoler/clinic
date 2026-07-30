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
import { User } from '../user/entities/user.entity';

@Injectable()
export class TreatmentService {
  constructor(
    @InjectRepository(Treatment)
    private readonly treatmentRepository: Repository<Treatment>,
  ) {}

  async create(
    createTreatmentDto: CreateTreatmentDto,
    user: User,
  ): Promise<ResponseTreatmentDto> {
    try {
      return await this.treatmentRepository.save({
        ...createTreatmentDto,
        userId: user.id,
      });
    } catch (error) {
      const message = 'Ocorreu um erro ao criar o tratamento.';

      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(message, error?.stack ?? error.message);

      throw new BadRequestException(message);
    }
  }

  async findAll(user: User): Promise<ResponseTreatmentDto[]> {
    return await this.treatmentRepository.find({
      where: { userId: user.id },
    });
  }

  async findOne(id: number, user: User): Promise<ResponseTreatmentDto> {
    return await this.treatmentRepository.findOne({
      where: { id, userId: user.id },
    });
  }

  async update(
    id: number,
    updateTreatmentDto: UpdateTreatmentDto,
    user: User,
  ): Promise<ResponseTreatmentDto> {
    try {
      let treatment = await this.treatmentRepository.findOne({
        where: { id, userId: user.id },
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

  async remove(id: number, user: User) {
    try {
      const treatment = await this.treatmentRepository.findOne({
        where: { id, userId: user.id },
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
