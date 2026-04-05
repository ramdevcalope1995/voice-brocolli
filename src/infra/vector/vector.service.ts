import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Index } from '@upstash/vector';

@Injectable()
export class VectorService {
  private readonly rootIndex: Index | null;
  private readonly namespace: string;

  constructor(config: ConfigService) {
    const url = config.get<string>('UPSTASH_VECTOR_REST_URL');
    const token = config.get<string>('UPSTASH_VECTOR_REST_TOKEN');
    this.namespace = config.get<string>('UPSTASH_VECTOR_NAMESPACE') ?? '';
    this.rootIndex =
      url && token ? new Index({ url, token }) : null;
  }

  enabled(): boolean {
    return this.rootIndex !== null;
  }

  /** Lightweight connectivity check (root index). */
  async ping(): Promise<void> {
    if (!this.rootIndex) {
      throw new Error(
        'Upstash Vector is not configured (UPSTASH_VECTOR_REST_URL / UPSTASH_VECTOR_REST_TOKEN).',
      );
    }
    await this.rootIndex.info();
  }

  /** Namespace helper (unset = default namespace). */
  ns(): Index {
    if (!this.rootIndex) {
      throw new Error(
        'Upstash Vector is not configured (UPSTASH_VECTOR_REST_URL / UPSTASH_VECTOR_REST_TOKEN).',
      );
    }
    if (this.namespace) {
      return this.rootIndex.namespace(this.namespace) as unknown as Index;
    }
    return this.rootIndex;
  }
}
