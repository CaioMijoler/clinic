import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  CreateFeedbackDto,
  FeedBackResponseDto,
} from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './entities/feedback.entity';
import { FilterDto } from '../../utils/filter-dto';
import { findAllWithQueryBuilder } from '../../utils/query-builder';
import { IPaginate } from '../../utils/paginate';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
  ) {}

  async create(
    createFeedbackDto: CreateFeedbackDto,
  ): Promise<FeedBackResponseDto> {
    try {
      return await this.feedbackRepository.save(createFeedbackDto);
    } catch (error) {
      const message = 'Ocorreu um erro ao criar o feedback.';

      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(message, error?.stack ?? error.message);

      throw new BadRequestException(message);
    }
  }

  async findAll(
    queryParams: FilterDto,
  ): Promise<IPaginate<Feedback> | Feedback[]> {
    try {
      return findAllWithQueryBuilder<Feedback>(
        this.feedbackRepository,
        queryParams,
        'fd',
      );
    } catch (error) {
      const message = 'Ocorreu um erro ao buscar os feedbacks.';
      Logger.error(message, error?.stack ?? error.message);
      throw new BadRequestException(message);
    }
  }

  async findOne(id: number): Promise<FeedBackResponseDto> {
    return await this.feedbackRepository.findOne({
      where: { id },
    });
  }

  async update(
    id: number,
    updateFeedbackDto: UpdateFeedbackDto,
  ): Promise<FeedBackResponseDto> {
    try {
      let feedback = await this.feedbackRepository.findOne({
        where: { id },
      });

      if (!feedback) {
        throw new BadRequestException('Não conseguimos encontrar o feedback.');
      }

      feedback = {
        ...feedback,
        ...updateFeedbackDto,
      };

      return await this.feedbackRepository.save(feedback);
    } catch (error) {
      const message = 'Ocorreu um erro ao atualizar o feedback.';

      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(message, error?.stack ?? error.message);

      throw new BadRequestException(message);
    }
  }

  async remove(id: number) {
    try {
      const feedback = await this.feedbackRepository.findOne({
        where: { id },
      });

      if (!feedback) {
        throw new BadRequestException(
          'Não conseguimos encontrar o feedback, tente novamente!',
        );
      }

      await this.feedbackRepository.remove(feedback);
    } catch (error) {
      const message = 'Ocorreu um erro ao remover o feedback.';

      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(message, error?.stack ?? error.message);

      throw new BadRequestException(message);
    }
  }
}
