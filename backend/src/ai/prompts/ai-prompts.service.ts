import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class AiPromptsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTemplate(featureName: string) {
    const template = await this.prisma.promptTemplate.findUnique({
      where: { featureName }
    });
    
    if (!template) {
      throw new NotFoundException(`Prompt template for feature ${featureName} not found`);
    }
    
    if (!template.isActive) {
      throw new BadRequestException(`Prompt template for feature ${featureName} is currently disabled`);
    }

    return template;
  }

  // Simple template interpolation replacing {{key}} with value
  interpolate(templateStr: string | null, variables: Record<string, string>): string {
    if (!templateStr) return '';
    
    let result = templateStr;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }
}
