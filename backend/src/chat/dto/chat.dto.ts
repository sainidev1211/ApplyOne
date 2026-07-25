import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChatSessionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;
}

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content!: string;
}

export class MessageFeedbackDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  messageId!: string;

  @ApiProperty({ description: '1 for upvote, -1 for downvote' })
  @IsNumber()
  feedback!: number;
}
