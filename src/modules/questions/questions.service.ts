import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  CreateQuestionDto,
  ResponseQuestionDto,
} from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from './entities/question.entity';
import { FilterDto } from '../../utils/filter-dto';
import { findAllWithQueryBuilder } from '../../utils/query-builder';
import { IPaginate } from '../../utils/paginate';
import { User } from '../user/entities/user.entity';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
  ) {}

  async create(
    createQuestionDto: CreateQuestionDto,
    user: User,
  ): Promise<ResponseQuestionDto> {
    try {
      return await this.questionRepository.save({
        ...createQuestionDto,
        userId: user.id,
      });
    } catch (error: any) {
      const message = 'Ocorreu um erro ao criar a questão.';

      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(message, error?.stack ?? error.message);

      throw new BadRequestException(message);
    }
  }

  async findAll(
    queryParams: FilterDto,
    user: User,
  ): Promise<IPaginate<ResponseQuestionDto> | ResponseQuestionDto[]> {
    try {
      const data = await findAllWithQueryBuilder<Question>(
        this.questionRepository,
        queryParams,
        'quest',
        { userId: user.id },
      );
      return data as IPaginate<ResponseQuestionDto> | ResponseQuestionDto[];
    } catch (error: any) {
      const message = 'Ocorreu um erro ao buscar as questões.';
      Logger.error(message, error?.stack ?? error.message);
      throw new BadRequestException(message);
    }
  }

  async findOne(id: number, user: User): Promise<ResponseQuestionDto> {
    return await this.questionRepository.findOne({
      where: { id, userId: user.id },
    });
  }

  async update(
    id: number,
    updateQuestionDto: UpdateQuestionDto,
    user: User,
  ): Promise<ResponseQuestionDto> {
    try {
      let question = await this.questionRepository.findOne({
        where: { id, userId: user.id },
      });

      if (!question) {
        throw new BadRequestException('Não conseguimos encontrar a questão.');
      }

      question = {
        ...question,
        ...updateQuestionDto,
      };

      return await this.questionRepository.save(question);
    } catch (error: any) {
      const message = 'Ocorreu um erro ao atualizar a questão.';

      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(message, error?.stack ?? error.message);

      throw new BadRequestException(message);
    }
  }

  async remove(id: number, user: User) {
    try {
      const question = await this.questionRepository.findOne({
        where: { id, userId: user.id },
      });

      if (!question) {
        throw new BadRequestException(
          'Não conseguimos encontrar a questão, tente novamente!',
        );
      }

      await this.questionRepository.remove(question);
    } catch (error: any) {
      const message = 'Ocorreu um erro ao remover a questão.';

      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(message, error?.stack ?? error.message);

      throw new BadRequestException(message);
    }
  }
}
