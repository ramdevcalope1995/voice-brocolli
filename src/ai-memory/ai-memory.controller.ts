import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AiMemoryService } from './ai-memory.service';

class RememberDto {
  text?: string;
  /** Dev-only when CLERK_AUTH_ENABLED is false */
  userId?: string;
}

class RecallDto {
  query?: string;
  userId?: string;
}

@Controller('ai-memory')
export class AiMemoryController {
  constructor(
    private readonly memory: AiMemoryService,
    private readonly config: ConfigService,
  ) {}

  private resolveUserId(req: Request, bodyUserId?: string): string {
    if (req.clerkUserId) {
      return req.clerkUserId;
    }
    if (this.config.get<string>('CLERK_AUTH_ENABLED') === 'true') {
      throw new UnauthorizedException();
    }
    const fallback = bodyUserId?.trim();
    if (!fallback) {
      throw new UnauthorizedException(
        'Provide a Clerk session or userId in the body when CLERK_AUTH_ENABLED=false',
      );
    }
    return fallback;
  }

  @Post('remember')
  async remember(@Req() req: Request, @Body() body: RememberDto) {
    const userId = this.resolveUserId(req, body.userId);
    return this.memory.remember(userId, body.text ?? '');
  }

  @Post('recall')
  async recall(@Req() req: Request, @Body() body: RecallDto) {
    const userId = this.resolveUserId(req, body.userId);
    return this.memory.recall(userId, body.query ?? '');
  }
}
