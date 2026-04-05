import { Injectable } from '@nestjs/common';
import { StreamService } from '../stream/stream.service';
import { AgentRunnerService } from './agent-runner.service';
import type { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class SalesDemoService {
  constructor(
    private readonly stream: StreamService,
    private readonly agentRunner: AgentRunnerService,
  ) {}

  async createSession(dto?: CreateSessionDto) {
    const displayName = dto?.displayName?.trim();
    const session = await this.stream.createSalesDemoSession(displayName);
    this.agentRunner.trySpawnAgent({
      callType: session.callType,
      callId: session.callId,
      botUserId: session.botUserId,
    });
    return {
      apiKey: session.apiKey,
      token: session.token,
      userId: session.userId,
      callType: session.callType,
      callId: session.callId,
      callCid: session.callCid,
    };
  }
}
