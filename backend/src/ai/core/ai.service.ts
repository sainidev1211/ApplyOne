import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { GeminiProvider } from '../providers/gemini.provider.js';
import { AiPromptsService } from '../prompts/ai-prompts.service.js';
import { AiHistoryService } from '../history/ai-history.service.js';
import { TokenUsageService } from '../history/token-usage.service.js';
import { AiCreditValidationService } from './ai-credit-validation.service.js';

export interface ExecuteAiParams {
  userId: string;
  featureName: string;
  variables: Record<string, string>;
  requiredCredits?: number;
  temperature?: number;
  maxTokens?: number;
}

@Injectable()
export class AiService {
  constructor(
    private readonly aiProvider: GeminiProvider, // We inject Gemini directly or via DI token in the future
    private readonly promptsService: AiPromptsService,
    private readonly historyService: AiHistoryService,
    private readonly tokenUsage: TokenUsageService,
    private readonly creditValidation: AiCreditValidationService,
  ) {}

  async executeFeature(params: ExecuteAiParams) {
    const startTime = Date.now();
    let status: 'SUCCESS' | 'FAILED' | 'TIMEOUT' = 'SUCCESS';
    let promptObj: any = {};
    let responseObj: any = {};

    try {
      // 1. Credit Validation
      const creditsToDeduct = params.requiredCredits || 1;
      await this.creditValidation.validateAndDeduct(
        params.userId,
        params.featureName,
        creditsToDeduct,
      );

      // 2. Fetch and Interpolate Prompt
      const template = await this.promptsService.getTemplate(
        params.featureName,
      );

      const systemPrompt = this.promptsService.interpolate(
        template.systemPrompt,
        params.variables,
      );
      const developerPrompt = this.promptsService.interpolate(
        template.developerPrompt,
        params.variables,
      );
      const userPrompt = this.promptsService.interpolate(
        template.userPrompt,
        params.variables,
      );

      promptObj = { systemPrompt, developerPrompt, userPrompt };

      // 3. Execute AI Request
      const result = await this.aiProvider.generateContent({
        systemPrompt,
        developerPrompt,
        userPrompt,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
      });

      responseObj = { content: result.content };

      // 4. Log Token Usage
      await this.tokenUsage.logUsage({
        userId: params.userId,
        feature: params.featureName,
        provider: result.provider,
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
        creditsUsed: creditsToDeduct,
      });

      // 5. Parse JSON response if necessary (Assume AI is asked to return JSON for complex features)
      let finalContent = result.content;
      try {
        // Strip markdown backticks if AI wrapped it in json block
        let cleanStr = result.content.trim();
        if (cleanStr.startsWith('\`\`\`json')) {
          cleanStr = cleanStr.substring(7);
          if (cleanStr.endsWith('\`\`\`')) {
            cleanStr = cleanStr.substring(0, cleanStr.length - 3);
          }
        }
        finalContent = JSON.parse(cleanStr);
        responseObj.parsed = finalContent;
      } catch (e) {
        // If not JSON, just return string
      }

      return finalContent;
    } catch (error: any) {
      status = 'FAILED';
      responseObj = { error: error.message, stack: error.stack };
      throw error;
    } finally {
      // 6. Log History (Always runs, even on failure)
      const executionTime = Date.now() - startTime;
      await this.historyService.logHistory({
        userId: params.userId,
        feature: params.featureName,
        provider: this.aiProvider.getProviderName(),
        prompt: promptObj,
        response: responseObj,
        status,
        executionTimeMs: executionTime,
      });
    }
  }
}
