import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Model } from 'mongoose';
import { generateText } from 'ai';
import { Notebook, NotebookDocument } from './schemas/notebook.schema';

const DEFAULT_TITLE = 'Untitled notebook';
const NOTEBOOK_STYLES = [
  { emoji: '🤖', tone: 'olive' },
  { emoji: '☕', tone: 'slate' },
  { emoji: '🎮', tone: 'plum' },
  { emoji: '🧪', tone: 'berry' },
  { emoji: '🎨', tone: 'smoke' },
  { emoji: '🔗', tone: 'ink' },
] as const;

type NotebookSummary = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  tone: string;
  messageCount: number;
  updatedAt: string;
  createdAt: string;
  lastMessagePreview: string;
};

@Injectable()
export class NotebooksService {
  private readonly modelId: string;

  constructor(
    @InjectModel(Notebook.name)
    private readonly notebookModel: Model<NotebookDocument>,
    private readonly config: ConfigService,
  ) {
    const apiKey =
      this.config.get<string>('AI_GATEWAY_API_KEY')?.trim() ||
      this.config.get<string>('VERCELAI_API_KEY')?.trim();
    if (apiKey && !process.env.AI_GATEWAY_API_KEY) {
      process.env.AI_GATEWAY_API_KEY = apiKey;
    }

    this.modelId =
      this.config.get<string>('AI_GATEWAY_MODEL')?.trim() ||
      this.config.get<string>('VERCELAI_MODEL')?.trim() ||
      'google/gemini-2.0-flash';
  }

  async listForUser(userId: string): Promise<NotebookSummary[]> {
    const notebooks = await this.notebookModel
      .find({ userId })
      .sort({ updatedAt: -1 })
      .exec();

    return notebooks.map((notebook) => this.toSummary(notebook));
  }

  async createForUser(
    userId: string,
    input: { title?: string; description?: string },
  ) {
    const style = NOTEBOOK_STYLES[
      Math.floor(Math.random() * NOTEBOOK_STYLES.length)
    ];
    const title = input.title?.trim() || DEFAULT_TITLE;
    const description = input.description?.trim() || '0 sources';

    const notebook = await this.notebookModel.create({
      userId,
      title,
      description,
      emoji: style.emoji,
      tone: style.tone,
      messages: [],
    });

    return this.toDetail(notebook);
  }

  async getForUser(userId: string, notebookId: string) {
    const notebook = await this.requireNotebook(userId, notebookId);
    return this.toDetail(notebook);
  }

  async chat(
    userId: string,
    notebookId: string,
    prompt: string,
  ): Promise<{
    reply: { id: string; role: 'assistant'; content: string; createdAt: string };
    notebook: ReturnType<NotebooksService['toDetail']>;
  }> {
    const content = prompt?.trim();
    if (!content) {
      throw new BadRequestException('message is required');
    }

    const notebook = await this.requireNotebook(userId, notebookId);
    const userMessage = {
      id: randomUUID(),
      role: 'user' as const,
      content,
      createdAt: new Date(),
    };

    notebook.messages.push(userMessage);

    const replyText = await this.generateNotebookReply(notebook, content);
    const reply = {
      id: randomUUID(),
      role: 'assistant' as const,
      content: replyText,
      createdAt: new Date(),
    };

    notebook.messages.push(reply);
    if (notebook.messages.length > 40) {
      notebook.messages = notebook.messages.slice(-40);
    }

    await notebook.save();

    return {
      reply: {
        ...reply,
        createdAt: reply.createdAt.toISOString(),
      },
      notebook: this.toDetail(notebook),
    };
  }

  private async generateNotebookReply(
    notebook: NotebookDocument,
    latestUserMessage: string,
  ): Promise<string> {
    if (!process.env.AI_GATEWAY_API_KEY) {
      throw new ServiceUnavailableException(
        'VERCELAI_API_KEY is not configured for notebook chat',
      );
    }

    const recentTurns = notebook.messages.slice(-12).map((message) => {
      const speaker = message.role === 'assistant' ? 'Assistant' : 'User';
      return `${speaker}: ${message.content}`;
    });

    const prompt = [
      `You are Agent-style research copilot for a notebook titled "${notebook.title}".`,
      'Be concise, practical, and easy to scan.',
      'Reply in plain text with short paragraphs or short bullets when useful.',
      'If the notebook has no sources, acknowledge that the answer is based only on the conversation.',
      '',
      `Notebook description: ${notebook.description || 'No description.'}`,
      'Recent conversation:',
      ...recentTurns,
      '',
      `Latest user message: ${latestUserMessage}`,
    ].join('\n');

    const { text } = await generateText({
      model: this.modelId,
      prompt,
    });

    return text.trim() || 'I could not generate a response just now.';
  }

  private async requireNotebook(userId: string, notebookId: string) {
    const notebook = await this.notebookModel.findOne({
      _id: notebookId,
      userId,
    });

    if (!notebook) {
      throw new NotFoundException('Notebook not found');
    }

    return notebook;
  }

  private toSummary(notebook: NotebookDocument): NotebookSummary {
    const lastMessage = notebook.messages.at(-1);
    return {
      id: notebook._id.toString(),
      title: notebook.title,
      description: notebook.description || '0 sources',
      emoji: notebook.emoji,
      tone: notebook.tone,
      messageCount: notebook.messages.length,
      createdAt: notebook.createdAt.toISOString(),
      updatedAt: notebook.updatedAt.toISOString(),
      lastMessagePreview: lastMessage?.content.slice(0, 120) || 'No chats yet',
    };
  }

  private toDetail(notebook: NotebookDocument) {
    return {
      ...this.toSummary(notebook),
      messages: notebook.messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      })),
    };
  }
}
