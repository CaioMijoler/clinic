import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../modules/auth/auth.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.authService.verifyToken(
        req.headers.authorization,
      );

      req.user = user;
      next();
    } catch (err) {
      throw new UnauthorizedException(`Usuário não autorizado.`);
    }
  }
}
