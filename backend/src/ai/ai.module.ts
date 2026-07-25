import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { AiFeaturesController } from './features/ai-features.controller.js';
import { AiService } from './core/ai.service.js';
import { AiCreditValidationService } from './core/ai-credit-validation.service.js';
import { AiPromptsService } from './prompts/ai-prompts.service.js';
import { AiHistoryService } from './history/ai-history.service.js';
import { TokenUsageService } from './history/token-usage.service.js';
import { GeminiProvider } from './providers/gemini.provider.js';
import { FeatureAccessService } from '../feature-access/feature-access.service.js';
import { CreditsService } from '../credits/credits.service.js';

@Module({
  controllers: [AiFeaturesController],
  providers: [
    PrismaService,
    AiService,
    AiCreditValidationService,
    AiPromptsService,
    AiHistoryService,
    TokenUsageService,
    GeminiProvider,
    FeatureAccessService,
    CreditsService
  ],
  exports: [AiService] // Export if other modules need programmatic access to AI
})
export class AiModule {}
