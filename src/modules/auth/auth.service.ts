import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from './dto/auth.dto';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { decryptText } from '@app/utils/helpers';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async auth(loginDto: LoginDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.username },
    });

    if (!user?.id) {
      throw new BadRequestException(
        'Não conseguimos encontrar este usuário, entre em contato com um administrador',
      );
    }
    try {
      if ((await decryptText(user?.password)) !== loginDto?.password) {
        throw new UnauthorizedException('Usuário ou Senha Inválidos');
      }

      const payload = { sub: user.id, email: user.email };

      const access_token = await this.jwtService.sign(payload, {
        secret: 'topSecret512',
        expiresIn: '1 days',
      });

      this.userRepository.update(user.id, {
        token: access_token,
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userData } = user;
      return {
        ...userData,
        token: access_token,
      };
    } catch (error) {
      const message: string = 'Verifique suas credenciais e tente novamente!';
      Logger.error({ message, error });
      throw new BadRequestException(message);
    }
  }

  async logout(accessToken: string): Promise<string> {
    try {
      const token = this.extractTokenFromHeader(accessToken);

      const user = await this.userRepository.findOne({
        where: { token: token },
      });

      await this.userRepository.update(user.id, {
        token: null,
      });

      return 'Usuário deslogado com sucesso';
    } catch (error) {
      const message: string =
        'Ocorreu um erro ao encerrar a sessão do usuário.';
      Logger.error({ message, error });
      throw new BadRequestException(message);
    }
  }

  async verifyToken(accessToken: string): Promise<User> {
    try {
      const token = this.extractTokenFromHeader(accessToken);
      await this.jwtService.verify(token, {
        secret: 'topSecret512',
      });

      const user = await this.userRepository.findOne({
        where: { token: token },
      });
      if (!user?.id) {
        throw new UnauthorizedException('Usuário ou Senha Inválidos');
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userData } = user;
      return userData;
    } catch (error) {
      const message: string = 'Token de acesso expirado!';
      Logger.error(message, error?.stack ?? error.message);

      throw new UnauthorizedException(error);
    }
  }

  private extractTokenFromHeader(accessToken: string): string {
    const [type, token] = accessToken?.split(' ') ?? [];
    return type === 'Bearer' ? token : '';
  }
}
