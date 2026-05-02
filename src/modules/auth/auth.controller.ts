import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthResponseDto, LoginDto } from './dto/auth.dto';
import { Request } from 'express';

@ApiTags('auth')
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  auth(@Body() authRequest: LoginDto): Promise<AuthResponseDto> {
    return this.authService.auth(authRequest);
  }

  @Post('/logout')
  @ApiBearerAuth()
  logout(@Req() request: Request): Promise<string> {
    const accessToken = request.headers?.authorization;
    return this.authService.logout(accessToken);
  }

  @Get('/verify/token')
  @ApiBearerAuth()
  verifyToken(@Req() request: Request): Promise<AuthResponseDto> {
    const accessToken = request.headers?.authorization;
    return this.authService.verifyToken(accessToken);
  }
}
