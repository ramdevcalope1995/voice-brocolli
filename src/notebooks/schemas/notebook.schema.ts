import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotebookDocument = HydratedDocument<Notebook>;

@Schema({ _id: false })
export class NotebookMessage {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true, enum: ['user', 'assistant'] })
  role: 'user' | 'assistant';

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ required: true, default: () => new Date() })
  createdAt: Date;
}

export const NotebookMessageSchema =
  SchemaFactory.createForClass(NotebookMessage);

@Schema({ timestamps: true, collection: 'notebooks' })
export class Notebook {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  title: string;

  @Prop({ trim: true, maxlength: 400 })
  description?: string;

  @Prop({ required: true, trim: true, maxlength: 6 })
  emoji: string;

  @Prop({ required: true, trim: true, maxlength: 32 })
  tone: string;

  @Prop({ type: [NotebookMessageSchema], default: [] })
  messages: NotebookMessage[];

  createdAt: Date;
  updatedAt: Date;
}

export const NotebookSchema = SchemaFactory.createForClass(Notebook);
