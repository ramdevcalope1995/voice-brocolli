import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RedisService } from '../infra/redis/redis.service';
import { VectorService } from '../infra/vector/vector.service';
import { AiMemory, AiMemoryDocument } from './schemas/ai-memory.schema';

const recentKey = (userId: string) => `ai:recent:${userId}`;

@Injectable()
export class AiMemoryService {
  constructor(
    @InjectModel(AiMemory.name)
    private readonly memoryModel: Model<AiMemoryDocument>,
    private readonly redis: RedisService,
    private readonly vector: VectorService,
  ) {}

  async remember(userId: string, text: string) {
    const trimmed = text?.trim();
    if (!trimmed) {
      throw new BadRequestException('text is required');
    }

    const doc = await this.memoryModel.create({ userId, text: trimmed });

    if (this.redis.enabled()) {
      const r = this.redis.get();
      await r.lpush(recentKey(userId), trimmed);
      await r.ltrim(recentKey(userId), 0, 99);
    }

    if (this.vector.enabled()) {
      const idx = this.vector.ns();
      await idx.upsert({
        id: doc._id.toString(),
        data: trimmed,
        metadata: { userId },
      });
    }

    return { id: doc._id.toString(), saved: true };
  }

  async recall(userId: string, query: string) {
    const q = query?.trim();
    if (!q) {
      throw new BadRequestException('query is required');
    }

    const recent: string[] = [];
    if (this.redis.enabled()) {
      const r = this.redis.get();
      const list = await r.lrange(recentKey(userId), 0, 19);
      recent.push(...(list as string[]));
    }

    let semantic: { id: string | number; score: number; data?: string }[] =
      [];
    if (this.vector.enabled()) {
      const idx = this.vector.ns();
      const safeUser = userId.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      try {
        const results = await idx.query({
          data: q,
          topK: 8,
          includeMetadata: true,
          includeData: true,
          filter: `userId = "${safeUser}"`,
        });
        semantic = results.map((r) => ({
          id: r.id,
          score: r.score,
          data: r.data,
        }));
      } catch {
        const wide = await idx.query({
          data: q,
          topK: 24,
          includeMetadata: true,
          includeData: true,
        });
        semantic = wide
          .filter((r) => (r.metadata as { userId?: string })?.userId === userId)
          .slice(0, 8)
          .map((r) => ({ id: r.id, score: r.score, data: r.data }));
      }
    }

    return { recent, semantic };
  }
}
