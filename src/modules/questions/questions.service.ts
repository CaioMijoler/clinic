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

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
  ) {}

  async create(
    createQuestionDto: CreateQuestionDto,
  ): Promise<ResponseQuestionDto> {
    try {
      return await this.questionRepository.save(createQuestionDto);
    } catch (error) {
      const message = 'Ocorreu um erro ao criar a questão.';

      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(message, error?.stack ?? error.message);

      throw new BadRequestException(message);
    }
  }

  async findAll(): Promise<ResponseQuestionDto[]> {
    return await this.questionRepository.find();
  }

  async findOne(id: number): Promise<ResponseQuestionDto> {
    return await this.questionRepository.findOne({ where: { id } });
  }

  async update(
    id: number,
    updateQuestionDto: UpdateQuestionDto,
  ): Promise<ResponseQuestionDto> {
    try {
      let question = await this.questionRepository.findOne({
        where: { id },
      });

      if (!question) {
        throw new BadRequestException('Não conseguimos encontrar a questão.');
      }

      question = {
        ...question,
        ...updateQuestionDto,
      };

      return await this.questionRepository.save(question);
    } catch (error) {
      const message = 'Ocorreu um erro ao atualizar a questão.';

      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(message, error?.stack ?? error.message);

      throw new BadRequestException(message);
    }
  }

  async remove(id: number) {
    try {
      const question = await this.questionRepository.findOne({
        where: { id },
      });

      if (!question) {
        throw new BadRequestException(
          'Não conseguimos encontrar a questão, tente novamente!',
        );
      }

      await this.questionRepository.remove(question);
    } catch (error) {
      const message = 'Ocorreu um erro ao remover a questão.';

      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(message, error?.stack ?? error.message);

      throw new BadRequestException(message);
    }
  }
}
