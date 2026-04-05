import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChildProcess, spawn } from 'child_process';
import { join } from 'path';

export type AgentSessionEnv = {
  callType: string;
  callId: string;
  botUserId: string;
};

@Injectable()
export class AgentRunnerService {
  private readonly logger = new Logger(AgentRunnerService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Spawns the Python Stream + Wubble agent when SALES_DEMO_SPAWN_AGENT is not "false".
   */
  trySpawnAgent(env: AgentSessionEnv): ChildProcess | null {
    const enabled = this.config.get<string>('SALES_DEMO_SPAWN_AGENT') !== 'false';
    if (!enabled) {
      this.logger.log(
        'SALES_DEMO_SPAWN_AGENT is false — start wubble-stream-agent manually (see backend/wubble-stream-agent/README.md).',
      );
      return null;
    }

    const agentDir = join(process.cwd(), 'wubble-stream-agent');
    const script = join(agentDir, 'main.py');

    const configured = this.config.get<string>('AGENT_PYTHON');
    const useWinPyLauncher =
      !configured && process.platform === 'win32';
    const command = configured ?? (useWinPyLauncher ? 'py' : 'python3');
    const args = useWinPyLauncher ? ['-3', script] : [script];

    const childEnv = {
      ...process.env,
      STREAM_API_KEY: this.config.get<string>('STREAM_API_KEY'),
      STREAM_API_SECRET: this.config.get<string>('STREAM_API_SECRET'),
      CALL_TYPE: env.callType,
      CALL_ID: env.callId,
      BOT_USER_ID: env.botUserId,
      WUBBLE_API_KEY: this.config.get<string>('WUBBLE_API_KEY') ?? '',
      WUBBLE_WS_URL: this.config.get<string>('WUBBLE_WS_URL') ?? '',
      PLACEHOLDER_TONE:
        this.config.get<string>('AGENT_PLACEHOLDER_TONE') ?? 'true',
    };

    const proc = spawn(command, args, {
      cwd: agentDir,
      env: childEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    proc.stdout?.on('data', (buf: Buffer) =>
      this.logger.log(`[agent] ${buf.toString().trimEnd()}`),
    );
    proc.stderr?.on('data', (buf: Buffer) =>
      this.logger.warn(`[agent] ${buf.toString().trimEnd()}`),
    );
    proc.on('exit', (code, signal) =>
      this.logger.log(`agent exited code=${code} signal=${signal}`),
    );

    this.logger.log(`Spawned sales agent (pid ${proc.pid})`);
    return proc;
  }
}
