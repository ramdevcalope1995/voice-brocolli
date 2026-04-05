import { Module } from '@nestjs/common';
import { QstashPublisherService } from './qstash-publisher.service';
import { QstashWebhookController } from './qstash-webhook.controller';

@Module({
  controllers: [QstashWebhookController],
  providers: [QstashPublisherService],
  exports: [QstashPublisherService],
})
export class QstashInfraModule {}
