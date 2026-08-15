import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { PDFParse } from 'pdf-parse';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from '../users/schemas/user.schema.js';
import { GroqAiAdapter } from '../ai/adapters/groq-ai.adapter.js';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AtsCheckDto {
  @IsString()
  resumeId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(12000)
  jobDescription?: string;

  // Keep compatibility with the existing client request field.
  @IsOptional()
  @IsString()
  @MaxLength(12000)
  jdText?: string;
}

@Injectable()
export class AtsService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly config: ConfigService,
    private readonly ai: GroqAiAdapter,
  ) {}

  async runAtsCheck(userId: string, dto: AtsCheckDto) {
    const user = await this.userModel.findById(userId).exec();
    const resume: any = user?.resumes?.find((item: any) => item.id === dto.resumeId);
    if (!user || !resume) throw new NotFoundException('Resume not found');
    const resumeText = await this.extractText(resume);
    if (resumeText.trim().length < 40) throw new BadRequestException('We could not read enough text from this resume. Upload a text-based PDF or DOCX.');
    const jobDescription = dto.jobDescription || dto.jdText || '';
    const prompt = `Analyze this ACTUAL uploaded resume for ATS compatibility. Return ONLY valid JSON with: atsScore, formattingScore, keywordScore, contactScore, impactScore (0-100), scoreReason (2-4 concise reasons tied to exact resume evidence), suggestions (3-6 actionable strings), missingSkills (array), matchedKeywords (array), jdMatchScore (0-100 or null), strengths (array), weaknesses (array), formattingIssues (array). Do not invent resume details or claim a keyword exists if it is absent.\n\nRESUME:\n${resumeText.slice(0, 24000)}\n\nJOB DESCRIPTION:\n${jobDescription.slice(0, 12000) || 'None provided'}`;
    const generated = await this.ai.chat({
      messages: [
        { role: 'system', content: 'You are a precise ATS resume evaluator. Base every finding only on supplied resume text. Output raw JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      maxTokens: 1800,
    });
    const parsed = this.parseJson(generated.content);
    const analysis = {
      atsScore: this.score(parsed.atsScore), formattingScore: this.score(parsed.formattingScore), keywordScore: this.score(parsed.keywordScore),
      contactScore: this.score(parsed.contactScore), impactScore: this.score(parsed.impactScore), suggestions: this.list(parsed.suggestions),
      missingSkills: this.list(parsed.missingSkills), matchedKeywords: this.list(parsed.matchedKeywords), jdMatchScore: jobDescription ? this.score(parsed.jdMatchScore) : null,
      strengths: this.list(parsed.strengths), weaknesses: this.list(parsed.weaknesses), formattingIssues: this.list(parsed.formattingIssues), scoreReason: this.list(parsed.scoreReason), analysisDate: new Date(),
    };
    resume.extractedText = resumeText;
    resume.atsAnalysis = analysis;
    resume.updatedAt = new Date();
    await user.save();
    return analysis;
  }

  async getHistory(userId: string) {
    const user = await this.userModel.findById(userId).lean().exec();
    return (user?.resumes || []).filter((resume: any) => resume.atsAnalysis).map((resume: any) => ({ resumeId: resume.id, fileName: resume.fileName, ...resume.atsAnalysis }));
  }

  private async extractText(resume: any): Promise<string> {
    if (resume.extractedText) return resume.extractedText;
    const uploadPath = this.config.get<string>('app.uploadPath', './uploads');
    const filePath = path.join(uploadPath, path.basename(resume.storagePath));
    if (resume.mimeType === 'application/pdf') {
      const parser = new PDFParse({ data: await fs.readFile(filePath) });
      try {
        return (await parser.getText()).text;
      } finally {
        await parser.destroy();
      }
    }
    if (resume.mimeType.includes('wordprocessingml')) {
      // DOCX is a ZIP; extracting the document XML avoids accepting client-provided text.
      const { stdout } = await promisify(execFile)('unzip', ['-p', filePath, 'word/document.xml']);
      return stdout.replace(/<w:tab\/>/g, ' ').replace(/<w:br\s*\/?/g, '\n').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    if (resume.mimeType === 'application/msword') throw new BadRequestException('Please replace legacy .doc with a PDF or .docx for ATS analysis.');
    return fs.readFile(filePath, 'utf8');
  }
  private parseJson(value: string): any { const start = value.indexOf('{'); const end = value.lastIndexOf('}'); if (start < 0 || end <= start) throw new BadRequestException('AI returned an invalid ATS response. Please retry.'); try { return JSON.parse(value.slice(start, end + 1)); } catch { throw new BadRequestException('AI returned an invalid ATS response. Please retry.'); } }
  private score(value: unknown) { const n = Number(value); return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 0; }
  private list(value: unknown) { return Array.isArray(value) ? value.map(String).slice(0, 8) : []; }
}
