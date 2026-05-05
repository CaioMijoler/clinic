import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { FilterUserDto } from './dto/filter-user.dto';
import { decryptText, encrypt } from '../../utils/helpers';

import { SupabaseService } from '../auth/supabase.service';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const provider = this.configService.get<string>('auth.provider');
      let supabaseId: string | null = null;

      if (provider === 'supabase') {
        const { data, error } = await this.supabaseService.getClient().auth.admin.createUser({
          email: createUserDto.email,
          password: createUserDto?.password,
          email_confirm: true,
          phone: createUserDto?.telephone,
          role: createUserDto?.type,
          user_metadata: {
            name: createUserDto?.name,
            document: createUserDto?.document,
            status: createUserDto?.status,
          },
        });

        if (error) {
          throw new BadRequestException(`Erro ao criar usuário no Supabase: ${error.message}`);
        }
        supabaseId = data.user.id;
      }

      const user = new User();
      user.name = createUserDto?.name;
      user.password = await encrypt(createUserDto?.password);
      user.document = createUserDto?.document;
      user.email = createUserDto?.email;
      user.telephone = createUserDto?.telephone;
      user.type = createUserDto?.type;
      user.status = createUserDto?.status;
      user.calendarId = createUserDto?.calendarId;
      user.clientEmail = createUserDto?.clientEmail;
      user.privateKey = createUserDto?.privateKey;
      user.whatsAppId = createUserDto?.whatsAppId;
      user.whatsAppToken = createUserDto?.whatsAppToken;
      user.supabaseId = supabaseId;

      return await this.userRepository.save(user);
    } catch (error) {
      Logger.error(error.message);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Ocorreu um erro ao criar o usuário.');
    }
  }

  async findAll(queryParams: FilterUserDto): Promise<User[]> {
    const { name } = queryParams;
    const where: { [key: string]: any } = {};

    if (name) {
      where.name = name;
    }
    const users = await this.userRepository.find({
      where,
    });

    return users ?? [];
  }

  async findOneByEmail(username: string) {
    return await this.userRepository.findOneBy({ email: username });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    user.password = await decryptText(user.password);

    return user;
  }

  async findBySupabaseId(supabaseId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { supabaseId } });
    if (!user) {
      throw new BadRequestException('Usuário não encontrado.');
    }
    if (user.password) {
      user.password = await decryptText(user.password);
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const userToUpdate = await this.userRepository.findOne({
      where: { id },
    });
    if (!userToUpdate) {
      throw new BadRequestException(
        `Não conseguimos encontrar o usuário, tente novamente!`,
      );
    }

    try {
      if (updateUserDto) {
        const provider = this.configService.get<string>('auth.provider');

        if (provider === 'supabase' && (updateUserDto.email || updateUserDto.password)) {
          const { error } = await this.supabaseService.getClient().auth.admin.updateUserById(
            userToUpdate.supabaseId,
            {
              email: updateUserDto.email,
              password: updateUserDto.password,
              role: updateUserDto?.type,
            },
          );

          if (error) {
            throw new BadRequestException(`Erro ao atualizar no Supabase: ${error.message}`);
          }
        }

        userToUpdate.name = updateUserDto?.name || userToUpdate.name;
        if (updateUserDto.password) {
          userToUpdate.password = await encrypt(updateUserDto.password);
        }
        userToUpdate.document =
          updateUserDto?.document || userToUpdate.document;
        userToUpdate.email = updateUserDto?.email || userToUpdate.email;
        userToUpdate.telephone =
          updateUserDto?.telephone || userToUpdate.telephone;
        userToUpdate.type = updateUserDto?.type || userToUpdate.type;
        userToUpdate.status = updateUserDto?.status || userToUpdate.status;
        userToUpdate.calendarId =
          updateUserDto?.calendarId || userToUpdate.calendarId;
        userToUpdate.clientEmail =
          updateUserDto?.clientEmail || userToUpdate.clientEmail;
        userToUpdate.privateKey =
          updateUserDto?.privateKey || userToUpdate.privateKey;
        userToUpdate.whatsAppId =
          updateUserDto?.whatsAppId || userToUpdate.whatsAppId;
        userToUpdate.whatsAppToken =
          updateUserDto?.whatsAppToken || userToUpdate.whatsAppToken;

        return await this.userRepository.save(userToUpdate);
      }
    } catch (error) {
      const errorMessage = 'Ocorreu um erro ao atualizar o usuário.';
      Logger.error(errorMessage, error);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(errorMessage);
    }
  }

  async remove(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new BadRequestException(
        'Não conseguimos encontrar o usuário, tente novamente!',
      );
    }

    try {
      const provider = this.configService.get<string>('auth.provider');
      if (provider === 'supabase' && user.supabaseId) {
        const { error } = await this.supabaseService.getClient().auth.admin.deleteUser(user.supabaseId);
        if (error) {
          throw new BadRequestException(`Erro ao remover do Supabase: ${error.message}`);
        }
      }

      await this.userRepository.remove(user);
    } catch (error) {
      const errorMessage = 'Ocorreu um erro ao remover usuário.';
      Logger.error(errorMessage, error);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(errorMessage);
    }
  }
}
