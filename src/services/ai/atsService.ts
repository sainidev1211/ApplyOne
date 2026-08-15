import { atsApi, resumeApi } from '@/services/api/apiClient';

export interface AtsAnalysisResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  formattingIssues: string[];
  scoreReason: string[];
}

/** Runs ATS only against the authenticated user's saved, uploaded resume. */
export async function analyzeSavedResumeWithAi(jobDescription?: string): Promise<AtsAnalysisResult> {
  const resumes = await resumeApi.getAll();
  const resume = resumes.find((item) => item.isDefault) || resumes[0];
  if (!resume) throw new Error('Upload a resume first. ATS analysis only uses your saved resume.');
  const data: any = await atsApi.analyze(resume.id, jobDescription);
  return {
    score: Number(data.atsScore ?? 0),
    strengths: Array.isArray(data.strengths) ? data.strengths : [],
    weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : (data.suggestions || []),
    missingKeywords: Array.isArray(data.missingSkills) ? data.missingSkills : [],
    formattingIssues: Array.isArray(data.formattingIssues) ? data.formattingIssues : [],
    scoreReason: Array.isArray(data.scoreReason) ? data.scoreReason : [],
  };
}
