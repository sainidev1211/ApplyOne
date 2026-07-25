import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { AiService } from '../ai/core/ai.service.js';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service.js';
import { CreateChatSessionDto, SendMessageDto } from './dto/chat.dto.js';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly knowledgeBaseService: KnowledgeBaseService
  ) {}

  async getConversations(userId: string) {
    return this.prisma.chatSession.findMany({
      where: { userId, isArchived: false },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getConversation(userId: string, id: string) {
    const session = await this.prisma.chatSession.findFirst({
      where: { id, userId, isArchived: false },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!session) throw new NotFoundException('Conversation not found');
    return session;
  }

  async createConversation(userId: string, dto: CreateChatSessionDto) {
    return this.prisma.chatSession.create({
      data: {
        userId,
        title: dto.title || 'New Conversation'
      }
    });
  }

  async deleteConversation(userId: string, id: string) {
    const session = await this.prisma.chatSession.findFirst({ where: { id, userId } });
    if (!session) throw new NotFoundException('Conversation not found');
    
    return this.prisma.chatSession.update({
      where: { id },
      data: { isArchived: true }
    });
  }

  async sendMessage(userId: string, sessionId: string, dto: SendMessageDto) {
    // 1. Verify Session
    const session = await this.getConversation(userId, sessionId);

    // 2. Save User Message
    const userMessage = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'USER',
        content: dto.content
      }
    });

    // 3. Build Context using RAG (Knowledge Base)
    const ragContext = await this.knowledgeBaseService.retrieveContext(dto.content);
    
    // 4. Build Conversation History Context
    const history = session.messages.slice(-5).map((m: any) => `${m.role}: ${m.content}`).join('\n');

    // 5. Call AiCoreEngine
    // Note: this uses the new AI Core Engine pattern
    const aiResponse = await this.aiService.executeFeature({
      userId,
      featureName: 'CHATBOT',
      variables: {
        context: ragContext,
        history: history,
        user_input: dto.content
      },
      requiredCredits: 1 // Deduct 1 credit per chat message
    });

    // 6. Save AI Response
    const assistantMessage = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'ASSISTANT',
        content: typeof aiResponse === 'string' ? aiResponse : JSON.stringify(aiResponse)
      }
    });

    return {
      userMessage,
      assistantMessage
    };
  }

  async submitFeedback(userId: string, messageId: string, feedback: number) {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: { session: true }
    });

    if (!message || message.session.userId !== userId) {
      throw new NotFoundException('Message not found');
    }

    return this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { feedback }
    });
  }
}
