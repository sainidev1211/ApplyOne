import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller.js';
import { PublicChatController } from './public-chat.controller.js';
import { ChatService } from './chat.service.js';
import { AiModule } from '../ai/ai.module.js';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module.js';
import { PrismaService } from '../database/prisma.service.js';
import { GroqAiAdapter } from '../ai/adapters/groq-ai.adapter.js';

@Module({
  imports: [AiModule, KnowledgeBaseModule],
  controllers: [ChatController, PublicChatController],
  providers: [ChatService, PrismaService, GroqAiAdapter],
})
export class ChatModule {}
