import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { FilterUserDto } from './dto/filter-user.dto';
import { decryptText, encrypt } from '@app/utils/helpers';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
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
      user.whatsAppToken = createUserDto?.whatsAppId;

      return await this.userRepository.save(user);
    } catch (error) {
      Logger.error(error.message);
      throw new BadRequestException('Ocorreu um erro ao criar o usuário.', {
        cause: new Error(),
        description: error,
      });
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
        userToUpdate.name = updateUserDto?.name || userToUpdate.name;
        userToUpdate.password =
          (await encrypt(updateUserDto?.password)) || userToUpdate.password;
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
      throw new BadRequestException(errorMessage, {
        cause: new Error(),
        description: error,
      });
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
      await this.userRepository.remove(user);
    } catch (error) {
      const errorMessage = 'Ocorreu um erro ao remover usuário.';
      Logger.error(errorMessage, error);
      throw new BadRequestException(errorMessage);
    }
  }
}
