import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AiMemoryDocument = HydratedDocument<AiMemory>;

@Schema({ timestamps: true, collection: 'ai_memories' })
export class AiMemory {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  text: string;
}

export const AiMemorySchema = SchemaFactory.createForClass(AiMemory);
