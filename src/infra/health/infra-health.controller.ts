import { Controller, Get } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { VectorService } from '../vector/vector.service';
import { QstashPublisherService } from '../qstash/qstash-publisher.service';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Public } from '../../auth/public.decorator';

@Controller('health')
export class InfraHealthController {
  constructor(
    @InjectConnection() private readonly mongo: Connection,
    private readonly redis: RedisService,
    private readonly vector: VectorService,
    private readonly qstash: QstashPublisherService,
  ) {}

  @Public()
  @Get('infra')
  async infra() {
    let mongoOk = false;
    try {
      mongoOk = this.mongo.readyState === 1;
    } catch {
      mongoOk = false;
    }

    let redisPing: 'ok' | 'skipped' | 'error' = 'skipped';
    if (this.redis.enabled()) {
      try {
        await this.redis.get().ping();
        redisPing = 'ok';
      } catch {
        redisPing = 'error';
      }
    }

    let vectorPing: 'ok' | 'skipped' | 'error' = 'skipped';
    if (this.vector.enabled()) {
      try {
        await this.vector.ping();
        vectorPing = 'ok';
      } catch {
        vectorPing = 'error';
      }
    }

    return {
      mongo: mongoOk ? 'connected' : 'disconnected',
      redis: redisPing,
      vector: vectorPing,
      qstash: this.qstash.enabled() ? 'configured' : 'skipped',
      auth: mongoOk ? 'configured' : 'skipped',
      authEnabled: mongoOk,
    };
  }
}
