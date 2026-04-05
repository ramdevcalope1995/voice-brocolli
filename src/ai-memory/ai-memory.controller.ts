import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth.types';
import { AiMemoryService } from './ai-memory.service';

class RememberDto {
  text?: string;
}

class RecallDto {
  query?: string;
}

@Controller('ai-memory')
export class AiMemoryController {
  constructor(private readonly memory: AiMemoryService) {}

  private resolveUserId(user?: AuthUser): string {
    if (!user?.id) {
      throw new UnauthorizedException('Please sign in to use AI memory');
    }
    return user.id;
  }

  @Post('remember')
  async remember(@CurrentUser() user: AuthUser | undefined, @Body() body: RememberDto) {
    const userId = this.resolveUserId(user);
    return this.memory.remember(userId, body.text ?? '');
  }

  @Post('recall')
  async recall(@CurrentUser() user: AuthUser | undefined, @Body() body: RecallDto) {
    const userId = this.resolveUserId(user);
    return this.memory.recall(userId, body.query ?? '');
  }
}
