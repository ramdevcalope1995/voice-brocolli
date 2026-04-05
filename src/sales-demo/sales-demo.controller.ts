import { Body, Controller, Post } from '@nestjs/common';
import { SalesDemoService } from './sales-demo.service';
import type { CreateSessionDto } from './dto/create-session.dto';
import { Public } from '../infra/clerk/public.decorator';

@Controller('sales-demo')
export class SalesDemoController {
  constructor(private readonly salesDemo: SalesDemoService) {}

  @Public()
  @Post('session')
  createSession(@Body() body: CreateSessionDto) {
    return this.salesDemo.createSession(body ?? {});
  }
}
