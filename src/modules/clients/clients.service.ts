import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Client } from './entities/client.entity';
import { FilterDto } from '../../utils/filter-dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientResponseDto } from './dto/client-response.dto';
import { findAllWithQueryBuilder } from '../../utils/query-builder';
import { IPaginate } from '../../utils/paginate';
import { User } from '../user/entities/user.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async create(
    createClientDto: CreateClientDto,
    user: User,
  ): Promise<ClientResponseDto> {
    try {
      const clientExists = await this.clientRepository.findOne({
        where: { email: createClientDto.email, userId: user.id },
      });

      if (clientExists) {
        throw new BadRequestException(
          'Não foi possivel cadastrar este client. O documento informado já existe.',
        );
      }

      return await this.clientRepository.save({
        ...createClientDto,
        userId: user.id,
      });
    } catch (error) {
      const message = 'Ocorreu um erro ao criar o cliente.';

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
  ): Promise<IPaginate<Client> | Client[]> {
    try {
      const params = { ...queryParams };
      if (params.relations) {
        if (!params.relations.includes('clientAddress')) {
          params.relations += ',clientAddress';
        }
      } else {
        params.relations = 'clientAddress';
      }

      return findAllWithQueryBuilder<Client>(
        this.clientRepository,
        params,
        'client',
        { userId: user.id },
      );
    } catch (error) {
      const message = 'Ocorreu um erro ao buscar os clientes.';
      Logger.error(message, error?.stack ?? error.message);
      throw new BadRequestException(message);
    }
  }

  async findOne(id: number, user: User): Promise<Client> {
    return await this.clientRepository.findOne({
      where: { id, userId: user.id },
      relations: { clientAddress: true },
    });
  }

  async update(
    id: number,
    updateClientDto: UpdateClientDto,
    user: User,
  ): Promise<ClientResponseDto> {
    try {
      let client = await this.clientRepository.findOne({
        where: { id, userId: user.id },
        relations: { clientAddress: true },
      });

      if (!client) {
        throw new BadRequestException('Não conseguimos encontrar o cliente.');
      }

      client.clientAddress = {
        ...client.clientAddress,
        ...updateClientDto.clientAddress,
      };

      client = {
        ...client,
        ...updateClientDto,
        clientAddress: client.clientAddress,
      };

      return await this.clientRepository.save(client);
    } catch (error) {
      const message = 'Ocorreu um erro ao atualizar o cliente.';

      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(message, error?.stack ?? error.message);

      throw new BadRequestException(message);
    }
  }

  async remove(id: number, user: User) {
    try {
      const client = await this.clientRepository.findOne({
        where: { id, userId: user.id },
      });

      if (!client) {
        throw new BadRequestException(
          'Não conseguimos encontrar o cliente, tente novamente!',
        );
      }

      await this.clientRepository.remove(client);
    } catch (error) {
      const message = 'Ocorreu um erro ao remover o cliente.';

      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(message, error?.stack ?? error.message);

      throw new BadRequestException(message);
    }
  }
}
