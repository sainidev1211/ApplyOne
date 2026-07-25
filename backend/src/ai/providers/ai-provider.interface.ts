export interface AiPromptRequest {
  systemPrompt?: string;
  developerPrompt?: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AiPromptResponse {
  content: string;
  provider: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface IAiProvider {
  generateContent(request: AiPromptRequest): Promise<AiPromptResponse>;
  getProviderName(): string;
}
