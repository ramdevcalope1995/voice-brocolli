import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis';

@Injectable()
export class RedisService {
  private readonly client: Redis | null;

  constructor(config: ConfigService) {
    const url = config.get<string>('UPSTASH_REDIS_REST_URL');
    const token = config.get<string>('UPSTASH_REDIS_REST_TOKEN');
    this.client =
      url && token ? new Redis({ url, token }) : null;
  }

  enabled(): boolean {
    return this.client !== null;
  }

  get(): Redis {
    if (!this.client) {
      throw new Error(
        'Upstash Redis is not configured (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).',
      );
    }
    return this.client;
  }
}
