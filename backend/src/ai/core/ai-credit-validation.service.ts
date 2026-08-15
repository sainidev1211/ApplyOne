import { Injectable, BadRequestException } from '@nestjs/common';
import { FeatureAccessService } from '../../feature-access/feature-access.service.js';
import { CreditsService } from '../../credits/credits.service.js';

@Injectable()
export class AiCreditValidationService {
  constructor(
    private readonly featureAccess: FeatureAccessService,
    private readonly creditsService: CreditsService,
  ) {}

  async validateAndDeduct(
    userId: string,
    featureName: string,
    requiredCredits: number = 1,
  ): Promise<boolean> {
    // 1. Check feature access and credits in one go (assuming AI features map to 'aiCredits')
    const access = await this.featureAccess.canAccessFeature(
      userId,
      'aiCredits',
    );

    if (!access.allowed || access.remainingCredits < requiredCredits) {
      throw new BadRequestException(
        `Access Denied: Insufficient AI Credits or feature locked`,
      );
    }

    // 3. Deduct the credits
    await this.creditsService.deductCredits({
      userId,
      feature: 'aiCredits',
      amount: requiredCredits,
      reason: `Used feature: ${featureName}`,
    });

    return true;
  }
}
