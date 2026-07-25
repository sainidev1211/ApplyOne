import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { AiService } from '../ai/core/ai.service.js';
import { Prisma } from '@prisma/client';

export class AtsCheckDto {
  resumeId!: string;
  jobDescription?: string;
}

@Injectable()
export class AtsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService
  ) {}

  async runAtsCheck(userId: string, dto: AtsCheckDto) {
    const resume = await this.prisma.resume.findFirst({ where: { id: dto.resumeId, userId } });
    if (!resume) throw new NotFoundException('Resume not found');

    // In reality, we'd extract text from S3/storage file based on resume.storagePath
    // Mock extraction here:
    const resumeText = 'Extracted text from resume PDF...'; 

    const featureName = dto.jobDescription ? 'ATS_COMPARE' : 'ATS_CHECK';
    
    // Call AI Core Engine to perform analysis
    const resultString = await this.aiService.executeFeature({
      userId,
      featureName,
      variables: {
        resume_text: resumeText,
        job_description: dto.jobDescription || ''
      },
      requiredCredits: 1
    });

    let analysisResult: any = {};
    try {
       analysisResult = typeof resultString === 'string' ? JSON.parse(resultString) : resultString;
    } catch (e) {
       analysisResult = { atsScore: 50 }; // fallback if AI fails to return JSON
    }

    // Assume AI returns JSON matching our DB schema needs
    // e.g. { atsScore, formattingScore, keywordScore, missingSkills, etc }
    
    // Save to ResumeAnalysis table
    const analysis = await this.prisma.resumeAnalysis.upsert({
      where: { resumeId: dto.resumeId },
      update: {
        atsScore: analysisResult.atsScore || 0,
        formattingScore: analysisResult.formattingScore || 0,
        keywordScore: analysisResult.keywordScore || 0,
        contactScore: analysisResult.contactScore || 0,
        impactScore: analysisResult.impactScore || 0,
        suggestions: analysisResult.suggestions as Prisma.InputJsonValue || [],
        missingSkills: analysisResult.missingSkills as Prisma.InputJsonValue || [],
        matchedKeywords: analysisResult.matchedKeywords as Prisma.InputJsonValue || [],
        jdMatchScore: analysisResult.jdMatchScore || null,
        jdText: dto.jobDescription || null,
        analysisDate: new Date()
      },
      create: {
        resumeId: dto.resumeId,
        atsScore: analysisResult.atsScore || 0,
        formattingScore: analysisResult.formattingScore || 0,
        keywordScore: analysisResult.keywordScore || 0,
        contactScore: analysisResult.contactScore || 0,
        impactScore: analysisResult.impactScore || 0,
        suggestions: analysisResult.suggestions as Prisma.InputJsonValue || [],
        missingSkills: analysisResult.missingSkills as Prisma.InputJsonValue || [],
        matchedKeywords: analysisResult.matchedKeywords as Prisma.InputJsonValue || [],
        jdMatchScore: analysisResult.jdMatchScore || null,
        jdText: dto.jobDescription || null
      }
    });

    return analysis;
  }

  async getHistory(userId: string) {
    return this.prisma.resumeAnalysis.findMany({
      where: { resume: { userId } },
      orderBy: { analysisDate: 'desc' },
      include: { resume: true }
    });
  }
}
