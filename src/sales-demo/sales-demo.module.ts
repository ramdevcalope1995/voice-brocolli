import { Module } from '@nestjs/common';
import { StreamModule } from '../stream/stream.module';
import { AgentRunnerService } from './agent-runner.service';
import { SalesDemoController } from './sales-demo.controller';
import { SalesDemoService } from './sales-demo.service';

@Module({
  imports: [StreamModule],
  controllers: [SalesDemoController],
  providers: [SalesDemoService, AgentRunnerService],
})
export class SalesDemoModule {}
