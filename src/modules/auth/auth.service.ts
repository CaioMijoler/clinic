import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthResponseDto, LoginDto } from './dto/auth.dto';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../cache/redis.service';
import { SupabaseService } from './supabase.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly redisService: RedisService,
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) { }

  async auth(loginDto: LoginDto): Promise<AuthResponseDto> {
    try {
      const { data, error } = await this.supabaseService.getClient().auth.signInWithPassword({
        email: loginDto.username,
        password: loginDto.password,
      });

      if (error) {
        throw new UnauthorizedException('Usuário ou Senha Inválidos');
      }

      const user = await this.userRepository.findOne({
        where: { email: loginDto.username },
      });

      if (!user) {
        throw new BadRequestException('Usuário não sincronizado no sistema local.');
      }

      const accessToken = data.session.access_token;
      const ttl = this.configService.get<number>('auth.tokenTtl');

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userData } = user;

      const authResponse: AuthResponseDto = {
        id: userData.id,
        name: userData.name,
        full_name: userData.name,
        username: userData.email,
        email: userData.email,
        document: userData.document,
        avatarUrl: data.user.user_metadata?.avatar_url || null,
        emailVerified: data.user.email_confirmed_at ? new Date(data.user.email_confirmed_at) : null,
        roles: [userData.type],
        accessToken: accessToken,
        type: userData.type as 'admin' | 'client',
        status: userData.status as 'active' | 'inactive',
        telephone: userData.telephone,
        whatsAppToken: userData.whatsAppToken,
        whatsAppId: userData.whatsAppId,
        supabaseId: userData.supabaseId,
      };

      await this.redisService.set(`auth_token:${accessToken}`, JSON.stringify(authResponse), ttl);
      return authResponse;
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

      await this.supabaseService.getClient().auth.signOut();

      const key = `auth_token:${token}`;
      await this.redisService.del(key);

      return 'Usuário deslogado com sucesso';
    } catch (error) {
      const message: string =
        'Ocorreu um erro ao encerrar a sessão do usuário.';
      Logger.error({ message, error });
      throw new BadRequestException(message);
    }
  }

  async verifyToken(accessToken: string): Promise<AuthResponseDto> {
    try {
      const token = this.extractTokenFromHeader(accessToken);

      // 1. Check Redis first
      const cachedUser = await this.redisService.get(`auth_token:${token}`);
      if (cachedUser) {
        return JSON.parse(cachedUser) as AuthResponseDto;
      }

      // 2. Verify with Supabase
      const { data, error } = await this.supabaseService.getClient().auth.getUser(token);
      if (error || !data.user) {
        throw new UnauthorizedException('Token de acesso inválido ou expirado!');
      }

      // 3. Find in local DB
      const user = await this.userRepository.findOne({
        where: { email: data.user.email },
      });

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado!');
      }

      const { password, ...userData } = user;
      const ttl = this.configService.get<number>('auth.tokenTtl');

      const authResponse: AuthResponseDto = {
        id: userData.id,
        name: userData.name,
        full_name: userData.name,
        username: userData.email,
        email: userData.email,
        document: userData.document,
        avatarUrl: data.user.user_metadata?.avatar_url || null,
        emailVerified: data.user.email_confirmed_at ? new Date(data.user.email_confirmed_at) : null,
        roles: [userData.type],
        accessToken: token,
        type: userData.type as 'admin' | 'client',
        status: userData.status as 'active' | 'inactive',
        telephone: userData.telephone,
        whatsAppToken: userData.whatsAppToken,
        whatsAppId: userData.whatsAppId,
        supabaseId: userData.supabaseId,
      };

      await this.redisService.set(`auth_token:${token}`, JSON.stringify(authResponse), ttl);
      return authResponse;
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
