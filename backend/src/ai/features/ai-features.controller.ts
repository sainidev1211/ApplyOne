import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from '../core/ai.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';
import { AiHistoryService } from '../history/ai-history.service.js';
import { TokenUsageService } from '../history/token-usage.service.js';

@ApiTags('AI Features')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiFeaturesController {
  constructor(
    private readonly aiService: AiService,
    private readonly historyService: AiHistoryService,
    private readonly tokenUsage: TokenUsageService
  ) {}

  @Post('resume/review')
  @ApiOperation({ summary: 'AI Resume Review' })
  async resumeReview(@Request() req: any, @Body() body: { resumeText: string }) {
    return this.aiService.executeFeature({
      userId: req.user.id,
      featureName: 'RESUME_REVIEW',
      variables: { resume_text: body.resumeText },
      requiredCredits: 1
    });
  }

  @Post('resume/rewrite')
  @ApiOperation({ summary: 'AI Resume Rewrite' })
  async resumeRewrite(@Request() req: any, @Body() body: { resumeText: string, tone: string }) {
    return this.aiService.executeFeature({
      userId: req.user.id,
      featureName: 'RESUME_REWRITE',
      variables: { resume_text: body.resumeText, tone: body.tone },
      requiredCredits: 2
    });
  }

  @Post('cover-letter')
  @ApiOperation({ summary: 'Generate Cover Letter' })
  async coverLetter(@Request() req: any, @Body() body: { resumeText: string, jobDescription: string, companyName: string, jobTitle: string, tone: string }) {
    return this.aiService.executeFeature({
      userId: req.user.id,
      featureName: 'COVER_LETTER',
      variables: { 
        resume_text: body.resumeText,
        job_description: body.jobDescription,
        company_name: body.companyName,
        job_title: body.jobTitle,
        tone: body.tone
      },
      requiredCredits: 1
    });
  }

  @Post('job-match')
  @ApiOperation({ summary: 'Analyze Job Match' })
  async jobMatch(@Request() req: any, @Body() body: { resumeText: string, jobDescription: string }) {
    return this.aiService.executeFeature({
      userId: req.user.id,
      featureName: 'JOB_MATCH',
      variables: { 
        resume_text: body.resumeText,
        job_description: body.jobDescription
      },
      requiredCredits: 1
    });
  }

  @Post('skill-gap')
  @ApiOperation({ summary: 'Analyze Skill Gap' })
  async skillGap(@Request() req: any, @Body() body: { currentSkills: string, targetRole: string }) {
    return this.aiService.executeFeature({
      userId: req.user.id,
      featureName: 'SKILL_GAP',
      variables: { 
        current_skills: body.currentSkills,
        target_role: body.targetRole
      },
      requiredCredits: 1
    });
  }

  @Post('career')
  @ApiOperation({ summary: 'Career Advisor' })
  async careerAdvisor(@Request() req: any, @Body() body: { profileData: string, goals: string }) {
    return this.aiService.executeFeature({
      userId: req.user.id,
      featureName: 'CAREER_ADVISOR',
      variables: { 
        profile_data: body.profileData,
        goals: body.goals
      },
      requiredCredits: 1
    });
  }

  @Post('interview/questions')
  @ApiOperation({ summary: 'Generate Interview Questions' })
  async interviewQuestions(@Request() req: any, @Body() body: { role: string, type: string, difficulty: string }) {
    return this.aiService.executeFeature({
      userId: req.user.id,
      featureName: 'INTERVIEW_QUESTIONS',
      variables: { 
        role: body.role,
        type: body.type, // e.g. HR, Technical, Behavioural
        difficulty: body.difficulty
      },
      requiredCredits: 1
    });
  }

  // --- Admin Endpoints ---

  @Get('admin/usage')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get AI Usage Stats' })
  async getUsageStats() {
    return this.tokenUsage.getUsageStats();
  }

  @Get('admin/history')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get AI Request History' })
  async getAdminHistory() {
    return this.historyService.getAdminHistory();
  }
}
