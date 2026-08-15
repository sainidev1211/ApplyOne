import {
  Controller,
  Post,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GroqAiAdapter } from '../ai/adapters/groq-ai.adapter.js';

@ApiTags('Public Chat')
@Controller('chat/public')
export class PublicChatController {
  constructor(private readonly groqAiAdapter: GroqAiAdapter) {}

  @Post()
  @ApiOperation({ summary: 'Public endpoint for landing page AI chat' })
  async handlePublicChat(
    @Body() body: { messages: { role: string; content: string }[] },
  ) {
    if (!body.messages || !Array.isArray(body.messages)) {
      return { content: 'Invalid message format.' };
    }

    // Apply system prompt to ensure the AI stays strictly on topic
    const systemPrompt = {
      role: 'system' as const,
      content: `You are the ApplyOne AI Assistant, designed to help users understand the platform.
ApplyOne is an AI-Powered Job Application Platform that automates applications, optimizes resumes for ATS algorithms, and provides smart job matching.
- Only answer questions related to ApplyOne, career advice, resumes, job applications, or pricing.
- Keep your answers concise, helpful, and professional.
- Do NOT hallucinate random information not related to the platform.
- If a user asks about something completely unrelated, politely pivot back to career optimization and ApplyOne features.
- If asked about pricing, mention Starter (₹999/mo), Professional (₹1299/mo), and Premium (₹1499/mo).
- You are not in simulation mode anymore. You are fully operational.`,
    };

    const finalMessages = [systemPrompt, ...body.messages] as any;

    try {
      const response = await this.groqAiAdapter.chat({
        messages: finalMessages,
      });
      return { content: response.content };
    } catch (error: any) {
      console.error('[PublicChat] Groq Error:', error);
      return {
        content:
          'I am currently experiencing some downtime. Please try again later.',
      };
    }
  }
}
