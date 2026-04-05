import {
  Controller,
  Headers,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common/interfaces';
import type { Request } from 'express';
import { Receiver } from '@upstash/qstash';
import { ConfigService } from '@nestjs/config';
import { Public } from '../clerk/public.decorator';

/**
 * QStash delivers signed POST requests here. Point your workflow destination URL
 * to `POST /webhooks/qstash/workflow` (public HTTPS in production).
 */
@Controller('webhooks/qstash')
export class QstashWebhookController {
  private readonly receiver: Receiver | null;

  constructor(config: ConfigService) {
    const current = config.get<string>('QSTASH_CURRENT_SIGNING_KEY');
    const next = config.get<string>('QSTASH_NEXT_SIGNING_KEY');
    this.receiver =
      current && next ? new Receiver({ currentSigningKey: current, nextSigningKey: next }) : null;
  }

  @Public()
  @Post('workflow')
  async handleWorkflow(
    @Req() req: RawBodyRequest<Request>,
    @Headers('upstash-signature') signature: string | undefined,
  ) {
    if (!this.receiver) {
      throw new UnauthorizedException('QStash receiver keys not configured');
    }
    if (!signature) {
      throw new UnauthorizedException('Missing upstash-signature');
    }

    const raw =
      req.rawBody?.toString('utf8') ??
      (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    const valid = await this.receiver.verify({
      signature,
      body: raw,
      url,
    });

    if (!valid) {
      throw new UnauthorizedException('Invalid QStash signature');
    }

    const payload =
      typeof req.body === 'object' && req.body !== null
        ? req.body
        : (JSON.parse(raw || '{}') as Record<string, unknown>);

    return {
      ok: true,
      received: true,
      type: payload['type'] ?? 'unknown',
    };
  }
}
