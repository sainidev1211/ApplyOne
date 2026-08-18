import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs/promises';
import * as os from 'os';
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
    
    // Extract text directly from the database-stored resume file buffer
    const resumeText = await this.extractText(resume);
    if (resumeText.trim().length < 40) {
      throw new BadRequestException(
        'We could not extract enough text from this resume. Please upload a clear text-based PDF or DOCX resume.',
      );
    }

    const jobDescription = (dto.jobDescription || dto.jdText || '').trim();
    const prompt = `You are an expert ATS (Applicant Tracking System) reviewer and hiring evaluator.
Analyze this ACTUAL candidate resume file content extracted from the system database for ATS compatibility, keyword density, formatting, structure, and job alignment.

Resume File Name: ${resume.fileName || 'Resume'}
Resume Extracted Content:
"""
${resumeText.slice(0, 24000)}
"""

${
  jobDescription
    ? `Target Job Description:\n"""\n${jobDescription.slice(0, 12000)}\n"""`
    : 'Target Job Description: None provided (evaluate overall general ATS standards for the candidate\'s indicated domain).'
}

Evaluate the resume thoroughly and return ONLY a valid JSON object with the following fields:
{
  "atsScore": <number 0-100>,
  "formattingScore": <number 0-100>,
  "keywordScore": <number 0-100>,
  "contactScore": <number 0-100>,
  "impactScore": <number 0-100>,
  "jdMatchScore": <number 0-100 or null if no job description provided>,
  "scoreReason": [<2-4 specific reasons detailing the score based directly on evidence from the resume>],
  "suggestions": [<3-6 actionable recommendations to boost ATS score>],
  "strengths": [<2-5 key strengths found in the resume>],
  "weaknesses": [<2-5 critical gaps or areas of improvement>],
  "missingSkills": [<array of important skills, technologies, or keywords that could enhance ATS ranking>],
  "matchedKeywords": [<array of prominent matching keywords found in the resume>],
  "formattingIssues": [<array of any potential formatting or structural risks detected, e.g. column layouts, missing headers, date formats>]
}

Rules:
1. Base every single finding strictly on the provided resume content.
2. Be objective, realistic, and constructive.
3. Return raw JSON only with no markdown wrapping or extra commentary.`;

    const generated = await this.ai.chat({
      messages: [
        {
          role: 'system',
          content: 'You are an advanced, precise ATS resume evaluator. Base every finding on the supplied resume text. Output raw valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      maxTokens: 2000,
    });

    const parsed = this.parseJson(generated.content);
    const analysis = {
      atsScore: this.score(parsed.atsScore),
      formattingScore: this.score(parsed.formattingScore),
      keywordScore: this.score(parsed.keywordScore),
      contactScore: this.score(parsed.contactScore),
      impactScore: this.score(parsed.impactScore),
      suggestions: this.list(parsed.suggestions),
      missingSkills: this.list(parsed.missingSkills),
      matchedKeywords: this.list(parsed.matchedKeywords),
      jdMatchScore: jobDescription ? this.score(parsed.jdMatchScore) : null,
      strengths: this.list(parsed.strengths),
      weaknesses: this.list(parsed.weaknesses),
      formattingIssues: this.list(parsed.formattingIssues),
      scoreReason: this.list(parsed.scoreReason),
      analysisDate: new Date(),
    };

    resume.extractedText = resumeText;
    resume.atsAnalysis = analysis;
    resume.updatedAt = new Date();
    await user.save();

    return analysis;
  }

  async getHistory(userId: string) {
    const user = await this.userModel.findById(userId).lean().exec();
    return (user?.resumes || [])
      .filter((resume: any) => resume.atsAnalysis)
      .map((resume: any) => ({
        resumeId: resume.id,
        fileName: resume.fileName,
        ...resume.atsAnalysis,
      }));
  }

  private async extractText(resume: any): Promise<string> {
    if (resume.extractedText && resume.extractedText.trim().length >= 40) {
      return resume.extractedText;
    }

    let fileBuffer: Buffer | null = null;

    // 1. Retrieve the file binary from the database
    if (resume.fileData) {
      fileBuffer = Buffer.isBuffer(resume.fileData)
        ? resume.fileData
        : Buffer.from(resume.fileData.buffer || resume.fileData);
    } else if (resume.storagePath && resume.storagePath !== 'database') {
      // 2. Fallback to legacy filesystem storage
      const uploadPath = this.config.get<string>('app.uploadPath', './uploads');
      const filePath = path.join(uploadPath, path.basename(resume.storagePath));
      try {
        fileBuffer = await fs.readFile(filePath);
      } catch (e) {
        // File not on disk
      }
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestException(
        'Resume file is not available in the database. Please re-upload your resume.',
      );
    }

    const mimeType = resume.mimeType || '';
    const fileName = (resume.fileName || '').toLowerCase();

    // PDF extraction
    if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
      const parser = new PDFParse({ data: fileBuffer });
      try {
        const parsed = await parser.getText();
        return parsed.text || '';
      } catch (err) {
        console.error('PDF parsing error:', err);
        throw new BadRequestException('Could not extract text from the uploaded PDF resume.');
      } finally {
        await parser.destroy();
      }
    }

    // DOCX extraction
    if (
      mimeType.includes('wordprocessingml') ||
      mimeType.includes('docx') ||
      fileName.endsWith('.docx')
    ) {
      const tempPath = path.join(os.tmpdir(), `resume-${Date.now()}-${Math.random().toString(36).slice(2)}.docx`);
      try {
        await fs.writeFile(tempPath, fileBuffer);
        const { stdout } = await promisify(execFile)('unzip', ['-p', tempPath, 'word/document.xml']);
        return stdout
          .replace(/<w:tab\/>/g, ' ')
          .replace(/<w:br\s*\/?/g, '\n')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      } catch (err) {
        console.error('DOCX parsing error:', err);
        throw new BadRequestException('Could not extract text from DOCX resume.');
      } finally {
        await fs.unlink(tempPath).catch(() => {});
      }
    }

    if (mimeType === 'application/msword' || fileName.endsWith('.doc')) {
      throw new BadRequestException(
        'Legacy .doc format is not supported for ATS text analysis. Please convert to PDF or .docx.',
      );
    }

    // Fallback: UTF-8 text
    return fileBuffer.toString('utf8');
  }

  private parseJson(value: string): any {
    const start = value.indexOf('{');
    const end = value.lastIndexOf('}');
    if (start < 0 || end <= start) {
      throw new BadRequestException('AI returned an invalid ATS response. Please retry.');
    }
    try {
      return JSON.parse(value.slice(start, end + 1));
    } catch {
      throw new BadRequestException('AI returned an invalid ATS response. Please retry.');
    }
  }

  private score(value: unknown) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 0;
  }

  private list(value: unknown) {
    return Array.isArray(value) ? value.map(String).slice(0, 8) : [];
  }
}
