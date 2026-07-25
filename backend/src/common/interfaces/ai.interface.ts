export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiChatRequest {
  messages: AiMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AiChatResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
}

export interface AiAnalyzeRequest {
  text: string;
  instruction: string;
  model?: string;
}

export interface AiAnalyzeResponse {
  result: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface IAiService {
  chat(request: AiChatRequest): Promise<AiChatResponse>;
  analyze(request: AiAnalyzeRequest): Promise<AiAnalyzeResponse>;
  isAvailable(): Promise<boolean>;
}

export const AI_SERVICE = Symbol('AI_SERVICE');
