import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@upstash/qstash';

@Injectable()
export class QstashPublisherService {
  private readonly client: Client | null;

  constructor(config: ConfigService) {
    const token = config.get<string>('QSTASH_TOKEN');
    const baseUrl = config.get<string>('QSTASH_URL');
    this.client = token ? new Client({ token, ...(baseUrl ? { baseUrl } : {}) }) : null;
  }

  enabled(): boolean {
    return this.client !== null;
  }

  get(): Client {
    if (!this.client) {
      throw new Error('QStash is not configured (QSTASH_TOKEN).');
    }
    return this.client;
  }

  /**
   * Enqueue a JSON workflow payload to your public HTTPS endpoint (configure URL in Upstash).
   */
  async publishWorkflow<T extends Record<string, unknown>>(args: {
    url: string;
    body: T;
    delaySeconds?: number;
    retries?: number;
  }) {
    const c = this.get();
    return c.publishJSON({
      url: args.url,
      body: args.body,
      delay: args.delaySeconds,
      retries: args.retries,
    });
  }
}
