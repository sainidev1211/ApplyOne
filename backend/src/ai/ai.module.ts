import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { AiFeaturesController } from './features/ai-features.controller.js';
import { AiService } from './core/ai.service.js';
import { AiCreditValidationService } from './core/ai-credit-validation.service.js';
import { AiPromptsService } from './prompts/ai-prompts.service.js';
import { AiHistoryService } from './history/ai-history.service.js';
import { TokenUsageService } from './history/token-usage.service.js';
import { GeminiProvider } from './providers/gemini.provider.js';
import { GroqAiAdapter } from './adapters/groq-ai.adapter.js';
import { FeatureAccessService } from '../feature-access/feature-access.service.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { CreditsModule } from '../credits/credits.module.js';

@Module({
  imports: [SubscriptionsModule, CreditsModule],
  controllers: [AiFeaturesController],
  providers: [
    PrismaService,
    AiService,
    AiCreditValidationService,
    AiPromptsService,
    AiHistoryService,
    TokenUsageService,
    GeminiProvider,
    GroqAiAdapter,
    FeatureAccessService,
  ],
  // Feature modules such as ATS use the configured provider directly for
  // document analysis, so expose it alongside the orchestration service.
  exports: [AiService, GeminiProvider, GroqAiAdapter],
})
export class AiModule {}
