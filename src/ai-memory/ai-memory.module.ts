import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiMemory, AiMemorySchema } from './schemas/ai-memory.schema';
import { AiMemoryController } from './ai-memory.controller';
import { AiMemoryService } from './ai-memory.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AiMemory.name, schema: AiMemorySchema }]),
  ],
  controllers: [AiMemoryController],
  providers: [AiMemoryService],
  exports: [AiMemoryService],
})
export class AiMemoryModule {}
