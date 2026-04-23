import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  CreatePathologyDto,
  ResponsePathologyDto,
} from './dto/create-pathology.dto';
import { UpdatePathologyDto } from './dto/update-pathology.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pathology } from './entities/pathology.entity';
import { findAllWithQueryBuilder } from '../../utils/query-builder';
import { FilterDto } from '../../utils/filter-dto';
import { IPaginate } from '../../utils/paginate';

@Injectable()
export class PathologiesService {
  constructor(
    @InjectRepository(Pathology)
    private readonly pathologyRepository: Repository<Pathology>,
  ) {}

  async create(
    createPathologyDto: CreatePathologyDto,
  ): Promise<ResponsePathologyDto> {
    try {
      return await this.pathologyRepository.save(createPathologyDto);
    } catch (error: any) {
      const message = 'Ocorreu um erro ao criar a patologia.';

      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(message, error?.stack ?? error.message);

      throw new BadRequestException(message);
    }
  }

  async findAll(
    queryParams: FilterDto,
  ): Promise<IPaginate<ResponsePathologyDto> | ResponsePathologyDto[]> {
    try {
      return findAllWithQueryBuilder<Pathology>(
        this.pathologyRepository,
        queryParams,
        'p',
      );
    } catch (error: any) {
      const message = 'Ocorreu um erro ao buscar as patologias.';
      Logger.error(message, error?.stack ?? error.message);
      throw new BadRequestException(message);
    }
  }

  async findOne(id: number): Promise<ResponsePathologyDto> {
    return await this.pathologyRepository.findOne({ where: { id } });
  }

  async update(
    id: number,
    updatePathologyDto: UpdatePathologyDto,
  ): Promise<ResponsePathologyDto> {
    try {
      let pathology = await this.pathologyRepository.findOne({
        where: { id },
      });

      if (!pathology) {
        throw new BadRequestException('Não conseguimos encontrar a patologia.');
      }

      pathology = {
        ...pathology,
        ...updatePathologyDto,
      };

      return await this.pathologyRepository.save(pathology);
    } catch (error: any) {
      const message = 'Ocorreu um erro ao atualizar a patologia.';

      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(message, error?.stack ?? error.message);

      throw new BadRequestException(message);
    }
  }

  async remove(id: number) {
    try {
      const pathology = await this.pathologyRepository.findOne({
        where: { id },
      });

      if (!pathology) {
        throw new BadRequestException(
          'Não conseguimos encontrar a patologia, tente novamente!',
        );
      }

      await this.pathologyRepository.remove(pathology);
    } catch (error: any) {
      const message = 'Ocorreu um erro ao remover a patologia.';

      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(message, error?.stack ?? error.message);

      throw new BadRequestException(message);
    }
  }
}
