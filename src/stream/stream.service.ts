import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StreamClient, UserRequest } from '@stream-io/node-sdk';
import { randomUUID } from 'crypto';

export const DEFAULT_CALL_TYPE = 'default';

@Injectable()
export class StreamService {
  private client: StreamClient | null = null;

  constructor(private readonly config: ConfigService) {}

  private getOrCreateClient(): StreamClient {
    if (this.client) return this.client;
    const apiKey = this.config.get<string>('STREAM_API_KEY');
    const secret = this.config.get<string>('STREAM_API_SECRET');
    if (!apiKey || !secret) {
      throw new ServiceUnavailableException(
        'STREAM_API_KEY and STREAM_API_SECRET must be configured',
      );
    }
    this.client = new StreamClient(apiKey, secret);
    return this.client;
  }

  getApiKey(): string {
    const apiKey = this.config.get<string>('STREAM_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException('STREAM_API_KEY must be configured');
    }
    return apiKey;
  }

  getClient(): StreamClient {
    return this.getOrCreateClient();
  }

  /**
   * Creates Stream users, a call owned by the bot, and a call-scoped token for the human.
   */
  async createSalesDemoSession(displayName?: string): Promise<{
    apiKey: string;
    token: string;
    userId: string;
    botUserId: string;
    callType: string;
    callId: string;
    callCid: string;
  }> {
    const humanId = `user-${randomUUID()}`;
    const botId = `wubble-sales-bot-${randomUUID()}`;
    const callId = randomUUID();
    const callType = DEFAULT_CALL_TYPE;
    const callCid = `${callType}:${callId}`;

    const users: UserRequest[] = [
      {
        id: humanId,
        name: displayName?.trim() || 'Guest',
        role: 'user',
      },
      {
        id: botId,
        name: 'Wubble Sales AI',
        role: 'user',
      },
    ];

    const client = this.getOrCreateClient();

    await client.upsertUsers(users);

    const call = client.video.call(callType, callId);
    await call.getOrCreate({
      data: {
        created_by_id: botId,
        video: true,
        members: [{ user_id: humanId }, { user_id: botId }],
      },
    });

    const validitySeconds = 3600; // 1 hour default
    const token = client.generateCallToken({
      user_id: humanId,
      call_cids: [callCid],
      validity_in_seconds: validitySeconds,
    });

    return {
      apiKey: this.getApiKey(),
      token,
      userId: humanId,
      botUserId: botId,
      callType,
      callId,
      callCid,
    };
  }
}
