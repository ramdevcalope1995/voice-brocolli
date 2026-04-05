import { Body, Controller, Get, Post, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.auth.register(body ?? {});
  }

  @Public()
  @Post('login')
  login(@Body() body: LoginDto) {
    return this.auth.login(body ?? {});
  }

  @Get('me')
  me(@Req() req: Request) {
    if (!req.authUser) {
      throw new UnauthorizedException();
    }

    return { user: req.authUser };
  }

  @Post('logout')
  async logout(@Req() req: Request) {
    if (req.authSessionToken) {
      await this.auth.logout(req.authSessionToken);
    }

    return { ok: true };
  }
}
