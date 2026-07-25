import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { IAiProvider, AiPromptRequest, AiPromptResponse } from './ai-provider.interface.js';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class GeminiProvider implements IAiProvider {
  private readonly ai: GoogleGenAI;

  constructor() {
    // Reads GEMINI_API_KEY from process.env
    this.ai = new GoogleGenAI({});
  }

  getProviderName(): string {
    return 'Google_Gemini';
  }

  async generateContent(request: AiPromptRequest): Promise<AiPromptResponse> {
    try {
      // In @google/genai, system instructions are configured in 'config'
      const config: any = {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens,
      };

      if (request.systemPrompt) {
        config.systemInstruction = request.systemPrompt;
      }

      // If developer prompt exists, we can prepend it to user prompt or add it to system instructions.
      // Gemini primarily uses systemInstruction. We will merge system and developer prompts if both exist.
      if (request.developerPrompt) {
         config.systemInstruction = (config.systemInstruction ? config.systemInstruction + '\n\n' : '') + request.developerPrompt;
      }

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: request.userPrompt,
        config
      });

      return {
        content: response.text || '',
        provider: this.getProviderName(),
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0
        }
      };
    } catch (error: any) {
      throw new InternalServerErrorException(`Gemini Provider Error: ${error.message}`);
    }
  }
}
