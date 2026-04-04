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

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async create(createClientDto: CreateClientDto): Promise<ClientResponseDto> {
    try {
      const clientExists = await this.clientRepository.findOne({
        where: { email: createClientDto.email },
      });

      if (clientExists) {
        throw new BadRequestException(
          'Não foi possivel cadastrar este client. O documento informado já existe.',
        );
      }

      return await this.clientRepository.save(createClientDto);
    } catch (error) {
      const message = 'Ocorreu um erro ao criar o cliente.';

      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(message, error?.stack ?? error.message);

      throw new BadRequestException(message);
    }
  }

  async findAll(queryParams: FilterDto): Promise<IPaginate<Client> | Client[]> {
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
      );
    } catch (error) {
      const message = 'Ocorreu um erro ao buscar os clientes.';
      Logger.error(message, error?.stack ?? error.message);
      throw new BadRequestException(message);
    }
  }

  async findOne(id: number): Promise<Client> {
    return await this.clientRepository.findOne({
      where: { id },
      relations: { clientAddress: true },
    });
  }

  async update(
    id: number,
    updateClientDto: UpdateClientDto,
  ): Promise<ClientResponseDto> {
    try {
      let client = await this.clientRepository.findOne({
        where: { id },
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

  async remove(id: number) {
    try {
      const client = await this.clientRepository.findOne({
        where: { id },
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
