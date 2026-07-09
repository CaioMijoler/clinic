import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateServiceDto, ResponseServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from './entities/service.entity';
import { FilterDto } from '../../utils/filter-dto';
import { IPaginate } from '../../utils/paginate';
import { queryBuild, paginateQuery } from '../../utils/paginate-query-builder';
import { User } from '../user/entities/user.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async create(
    createServiceDto: CreateServiceDto,
    user: User,
  ): Promise<ResponseServiceDto> {
    try {
      return await this.serviceRepository.save({
        ...createServiceDto,
        active: createServiceDto.active ?? true,
        userId: user.id,
      });
    } catch (error: unknown) {
      const message = 'Ocorreu um erro ao criar o serviço.';

      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(
        message,
        error instanceof Error ? error.stack : String(error),
      );

      throw new BadRequestException(message);
    }
  }

  async findAll(
    queryParams: FilterDto,
    user: User,
  ): Promise<IPaginate<ResponseServiceDto> | ResponseServiceDto[]> {
    try {
      const {
        current_page = 1,
        per_page = 10,
        paginate,
        limit,
      } = { ...queryParams };
      const alias = 'svc';
      const queryBuilder = this.serviceRepository.createQueryBuilder(alias);

      queryBuilder.where(`${alias}.user_id = :userId`, { userId: user.id });
      queryBuild(queryBuilder, queryParams, alias);

      if (paginate) {
        const [response, total] = await paginateQuery(
          queryBuilder,
          paginate,
          current_page,
          per_page,
          limit,
        ).getManyAndCount();

        return {
          pagination: {
            current_page,
            per_page,
            total,
          },
          data: response,
        };
      }

      return await queryBuilder.getMany();
    } catch (error: unknown) {
      const message = 'Ocorreu um erro ao buscar os serviços.';
      Logger.error(
        message,
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadRequestException(message);
    }
  }

  async findOne(id: number, user: User): Promise<ResponseServiceDto> {
    const service = await this.serviceRepository.findOne({
      where: { id, userId: user.id },
    });

    if (!service) {
      throw new NotFoundException('Não conseguimos encontrar o serviço.');
    }

    return service;
  }

  async update(
    id: number,
    updateServiceDto: UpdateServiceDto,
    user: User,
  ): Promise<ResponseServiceDto> {
    try {
      const service = await this.serviceRepository.findOne({
        where: { id, userId: user.id },
      });

      if (!service) {
        throw new NotFoundException('Não conseguimos encontrar o serviço.');
      }

      return await this.serviceRepository.save({
        ...service,
        ...updateServiceDto,
      });
    } catch (error: unknown) {
      const message = 'Ocorreu um erro ao atualizar o serviço.';

      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(
        message,
        error instanceof Error ? error.stack : String(error),
      );

      throw new BadRequestException(message);
    }
  }

  async remove(id: number, user: User): Promise<void> {
    try {
      const service = await this.serviceRepository.findOne({
        where: { id, userId: user.id },
      });

      if (!service) {
        throw new NotFoundException(
          'Não conseguimos encontrar o serviço, tente novamente!',
        );
      }

      await this.serviceRepository.remove(service);
    } catch (error: unknown) {
      const message = 'Ocorreu um erro ao remover o serviço.';

      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(
        message,
        error instanceof Error ? error.stack : String(error),
      );

      throw new BadRequestException(message);
    }
  }
}
