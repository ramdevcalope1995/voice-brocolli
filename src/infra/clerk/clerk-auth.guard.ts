import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const enabled =
      this.config.get<string>('CLERK_AUTH_ENABLED', 'false') === 'true';
    if (!enabled) {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const secret = this.config.get<string>('CLERK_SECRET_KEY');
    if (!secret) {
      throw new UnauthorizedException('CLERK_SECRET_KEY is not configured');
    }

    const req = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      clerkUserId?: string;
    }>();

    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    const token = header.slice('Bearer '.length).trim();
    const payload = await verifyToken(token, { secretKey: secret }).catch(
      () => null,
    );
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid Clerk session token');
    }
    req.clerkUserId = payload.sub;

    return true;
  }
}
