import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth.types';
import { NotebooksService } from './notebooks.service';

class CreateNotebookDto {
  title?: string;
  description?: string;
}

class NotebookChatDto {
  message?: string;
}

@Controller('notebooks')
export class NotebooksController {
  constructor(private readonly notebooks: NotebooksService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser | undefined) {
    return this.notebooks.listForUser(this.requireUserId(user));
  }

  @Post()
  async create(
    @CurrentUser() user: AuthUser | undefined,
    @Body() body: CreateNotebookDto,
  ) {
    return this.notebooks.createForUser(this.requireUserId(user), body);
  }

  @Get(':id')
  async get(@CurrentUser() user: AuthUser | undefined, @Param('id') id: string) {
    return this.notebooks.getForUser(this.requireUserId(user), id);
  }

  @Post(':id/chat')
  async chat(
    @CurrentUser() user: AuthUser | undefined,
    @Param('id') id: string,
    @Body() body: NotebookChatDto,
  ) {
    return this.notebooks.chat(this.requireUserId(user), id, body.message ?? '');
  }

  private requireUserId(user?: AuthUser): string {
    if (!user?.id) {
      throw new UnauthorizedException('Please sign in to use notebooks');
    }
    return user.id;
  }
}
