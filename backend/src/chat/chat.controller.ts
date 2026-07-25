import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service.js';
import { CreateChatSessionDto, SendMessageDto, MessageFeedbackDto } from './dto/chat.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Get all active conversations' })
  getConversations(@Request() req: any) {
    return this.chatService.getConversations(req.user.id);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Create new conversation' })
  createConversation(@Request() req: any, @Body() dto: CreateChatSessionDto) {
    return this.chatService.createConversation(req.user.id, dto);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get specific conversation with history' })
  getConversation(@Request() req: any, @Param('id') id: string) {
    return this.chatService.getConversation(req.user.id, id);
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Archive/Delete a conversation' })
  deleteConversation(@Request() req: any, @Param('id') id: string) {
    return this.chatService.deleteConversation(req.user.id, id);
  }

  @Post('message')
  @ApiOperation({ summary: 'Send a message to the AI Chatbot' })
  sendMessage(@Request() req: any, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(req.user.id, dto.sessionId, dto);
  }

  @Post('feedback')
  @ApiOperation({ summary: 'Submit feedback for a specific message (1 or -1)' })
  submitFeedback(@Request() req: any, @Body() dto: MessageFeedbackDto) {
    return this.chatService.submitFeedback(req.user.id, dto.messageId, dto.feedback);
  }
}
