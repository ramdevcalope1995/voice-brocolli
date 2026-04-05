import { Module } from '@nestjs/common';
import { InfraHealthController } from './infra-health.controller';
import { QstashInfraModule } from '../qstash/qstash.module';

@Module({
  imports: [QstashInfraModule],
  controllers: [InfraHealthController],
})
export class InfraHealthModule {}
