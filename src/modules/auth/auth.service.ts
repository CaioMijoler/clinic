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
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@app/cache/redis.service';
import { SupabaseService } from './supabase.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) { }

  async auth(loginDto: LoginDto): Promise<User> {
    try {
      const provider = this.configService.get<string>('auth.provider');
      let accessToken: string;
      let user: User;

      if (provider === 'supabase') {
        const { data, error } = await this.supabaseService.getClient().auth.signInWithPassword({
          email: loginDto.username,
          password: loginDto.password,
        });

        if (error) {
          throw new UnauthorizedException('Usuário ou Senha Inválidos');
        }

        accessToken = data.session.access_token;
        user = await this.userRepository.findOne({
          where: { email: loginDto.username },
        });
      } else {
        // Local authentication
        user = await this.userRepository.findOne({
          where: { email: loginDto.username },
        });
        if (!user) {
          throw new UnauthorizedException('Usuário ou Senha Inválidos');
        }
        const isPasswordValid = (await decryptText(user.password)) === loginDto.password;
        if (!isPasswordValid) {
          throw new UnauthorizedException('Usuário ou Senha Inválidos');
        }

        const payload = { sub: user.id, email: user.email };

        accessToken = this.jwtService.sign(payload, {
          secret: this.configService.get('auth.jwtSecret'),
          expiresIn: '1d',
        });
      }

      if (!user) {
        throw new BadRequestException('Usuário não sincronizado no sistema local.');
      }

      await this.userRepository.update(user.id, {
        token: accessToken,
      });

      const ttl = this.configService.get<number>('auth.tokenTtl');

      await this.redisService.set(`auth_token:${accessToken}`, JSON.stringify(user), ttl);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userData } = user;
      return {
        ...userData,
        token: accessToken,
      };
    } catch (error) {
      const message: string = error instanceof UnauthorizedException
        ? error.message
        : 'Verifique suas credenciais e tente novamente!';
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
      if (user) {
        await this.userRepository.update(user.id, {
          token: null,
        });
      }

      // 2. Remove from Redis
      const key = `auth_token:${token}`;
      await this.redisService.set(key, '', 0);

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
      const provider = this.configService.get<string>('auth.provider');

      // 1. Check Redis first
      const cachedUser = await this.redisService.get(`auth_token:${token}`);
      if (cachedUser) {
        return JSON.parse(cachedUser);
      }

      let email: string;

      if (provider === 'supabase') {
        const { data, error } = await this.supabaseService.getClient().auth.getUser(token);
        if (error || !data.user) {
          throw new UnauthorizedException('Token de acesso inválido ou expirado!');
        }
        email = data.user.email;
      } else {
        try {
          const payload = this.jwtService.verify(token, {
            secret: this.configService.get('auth.jwtSecret'),
          });
          email = payload.email;
        } catch (e) {
          throw new UnauthorizedException('Token de acesso inválido ou expirado!');
        }
      }

      // 2. Find in DB and re-cache
      const user = await this.userRepository.findOne({
        where: { email },
      });

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado!');
      }

      const { password, ...userData } = user;
      const ttl = this.configService.get<number>('auth.tokenTtl');
      await this.redisService.set(`auth_token:${token}`, JSON.stringify(userData), ttl);

      return userData as User;
    } catch (error: unknown) {
      const message: string = error instanceof UnauthorizedException
        ? error.message
        : 'Token de acesso expirado!';
      Logger.error(message, error instanceof Error ? error.stack : undefined);

      throw new UnauthorizedException(message);
    }
  }

  private extractTokenFromHeader(accessToken: string): string {
    const [type, token] = accessToken?.split(' ') ?? [];
    return type === 'Bearer' ? token : '';
  }
}
