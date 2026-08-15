import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IAiService,
  AiChatRequest,
  AiChatResponse,
  AiAnalyzeRequest,
  AiAnalyzeResponse,
} from '../../common/interfaces/ai.interface';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqResponseChoice {
  message: {
    content: string;
  };
  finish_reason: string;
}

interface GroqUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface GroqChatResponse {
  id: string;
  model: string;
  choices: GroqResponseChoice[];
  usage: GroqUsage;
}

@Injectable()
export class GroqAiAdapter implements IAiService {
  private readonly logger = new Logger(GroqAiAdapter.name);
  private readonly apiKey: string;
  private readonly defaultModel: string;
  private readonly baseUrl = 'https://api.groq.com/openai/v1';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('groq.apiKey', '');
    this.defaultModel = this.configService.get<string>(
      'groq.model',
      'llama3-8b-8192',
    );
  }

  async chat(request: AiChatRequest): Promise<AiChatResponse> {
    const model = request.model ?? this.defaultModel;

    const body = {
      model,
      messages: request.messages as GroqMessage[],
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 1024,
    };

    const groqResponse = await this.callGroqApi<GroqChatResponse>(
      '/chat/completions',
      body,
    );

    return {
      content: groqResponse.choices[0]?.message?.content ?? '',
      model: groqResponse.model,
      usage: {
        promptTokens: groqResponse.usage.prompt_tokens,
        completionTokens: groqResponse.usage.completion_tokens,
        totalTokens: groqResponse.usage.total_tokens,
      },
      finishReason: groqResponse.choices[0]?.finish_reason ?? 'stop',
    };
  }

  async analyze(request: AiAnalyzeRequest): Promise<AiAnalyzeResponse> {
    const chatRequest: AiChatRequest = {
      messages: [
        { role: 'system', content: request.instruction },
        { role: 'user', content: request.text },
      ],
      model: request.model ?? this.defaultModel,
    };

    const chatResponse = await this.chat(chatRequest);

    return {
      result: chatResponse.content,
      model: chatResponse.model,
      usage: chatResponse.usage,
    };
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.warn('Groq API key is not configured');
      return false;
    }

    try {
      await this.callGroqApi<unknown>('/models', null, 'GET');
      return true;
    } catch {
      this.logger.warn('Groq API is not reachable');
      return false;
    }
  }

  private async callGroqApi<T>(
    endpoint: string,
    body: unknown,
    method: 'POST' | 'GET' = 'POST',
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    };

    if (method === 'POST' && body !== null) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Groq API error ${response.status}: ${errorText}`);
      throw new Error(`Groq API request failed with status ${response.status}`);
    }

    return response.json() as Promise<T>;
  }
}
