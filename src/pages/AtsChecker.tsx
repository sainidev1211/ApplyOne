import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TextArea } from '@/components/ui/TextArea';
import { SEO } from '@/components/shared/SEO';
import { toast } from '@/store/toastStore';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeSavedResumeWithAi, AtsAnalysisResult } from '@/services/ai/atsService';

export default function AtsChecker() {
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AtsAnalysisResult | null>(null);

  // Run ATS Analysis
  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await analyzeSavedResumeWithAi(jobDescription.trim() || undefined);

      setResult(data);
      toast.success(`ATS Analysis complete! Score: ${data.score}/100`, 'Analysis Success');

    } catch (err: any) {
      console.error('ATS Analysis Error:', err);
      const errMsg = err.message || 'ATS evaluation failed. Please check your connection and retry.';
      setError(errMsg);
      toast.error(errMsg, 'Analysis Failed');
    } finally {
      setLoading(false);
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 75) return { variant: 'success' as const, label: 'Excellent ATS Match' };
    if (score >= 50) return { variant: 'warning' as const, label: 'Fair Alignment' };
    return { variant: 'accent' as const, label: 'Needs Optimization' };
  };

  return (
    <>
      <SEO title="ATS Score Checker" description="Evaluate your resume against ATS algorithms in real-time." />
      <div className="space-y-8 text-left max-w-5xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-light dark:border-border-dark pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary-light dark:text-text-primary-dark">
              ATS Resume Evaluator
            </h1>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
              Real-time AI analysis of keyword density, action verbs, readability, and structural ATS compatibility.
            </p>
          </div>
          <Badge variant="info" className="self-start md:self-auto py-1 px-3">
            🤖 Powered by Live Groq AI
          </Badge>
        </div>

        {/* Input Form Section */}
        <Card className="p-6 md:p-8 border border-border-light dark:border-border-dark bg-white dark:bg-card-dark shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border-light dark:border-border-dark pb-4">
            <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
              1. Analyze Your Saved Resume
            </h2>
            <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Uses the resume currently saved to your account</span>
          </div>

          <div className="max-w-3xl space-y-2">
              <label className="block text-xs font-bold text-text-primary-light dark:text-text-primary-dark uppercase tracking-wider">
                Target Job Description <span className="text-text-secondary-light font-normal">(Optional)</span>
              </label>
              <textarea
                rows={10}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job posting description here to get targeted keyword matching..."
                className="w-full p-4 text-xs font-sans bg-slate-50 dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-primary-light dark:text-text-primary-dark transition-all"
              />
              <span className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark block text-right">
                {jobDescription.length} characters
              </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-light dark:border-border-dark">
            {jobDescription && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setJobDescription('');
                  setResult(null);
                  setError(null);
                }}
              >
                Clear Inputs
              </Button>
            )}
            <Button
              variant="gradient"
              size="lg"
              onClick={handleAnalyze}
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Evaluating Resume...' : '⚡ Run ATS AI Evaluation'}
            </Button>
          </div>
        </Card>

        {/* LOADING STATE */}
        {loading && (
          <Card className="p-12 border border-border-light dark:border-border-dark bg-white dark:bg-card-dark shadow-lg text-center space-y-6 animate-pulse">
            <div className="flex justify-center">
              <div className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                Analyzing Resume with Groq AI...
              </h3>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark max-w-sm mx-auto">
                Parsing keywords, scanning action verbs, calculating ATS match score, and generating tailored recommendations.
              </p>
            </div>
          </Card>
        )}

        {/* ERROR STATE WITH RETRY */}
        {error && !loading && (
          <Card className="p-8 border border-red-500/40 bg-red-50/20 dark:bg-red-950/20 shadow-md text-left space-y-4">
            <div className="flex items-start gap-4">
              <span className="text-2xl">⚠️</span>
              <div className="space-y-1 flex-1">
                <h3 className="text-base font-bold text-red-900 dark:text-red-300">
                  ATS Evaluation Failed
                </h3>
                <p className="text-xs text-red-700 dark:text-red-400">
                  {error}
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={() => handleAnalyze()}>
                🔄 Retry Analysis
              </Button>
            </div>
          </Card>
        )}

        {/* RESULTS SECTION */}
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
          >
            {/* Top Score Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Radial Progress Score Box */}
              <Card className="p-8 border border-border-light dark:border-border-dark bg-white dark:bg-card-dark shadow-md flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark mb-4">
                  Overall ATS Score
                </span>
                <div className="relative h-44 w-44 flex items-center justify-center mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      className="text-slate-100 dark:text-slate-800"
                      strokeWidth="10"
                      stroke="currentColor"
                      fill="transparent"
                      r="38"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className={
                        result.score >= 75
                          ? 'text-emerald-500'
                          : result.score >= 50
                          ? 'text-amber-500'
                          : 'text-red-500'
                      }
                      strokeWidth="10"
                      strokeDasharray={238.76}
                      strokeDashoffset={238.76 - (238.76 * result.score) / 100}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="38"
                      cx="50"
                      cy="50"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-text-primary-light dark:text-text-primary-dark">
                      {result.score}
                    </span>
                    <span className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark font-bold uppercase">
                      Out of 100
                    </span>
                  </div>
                </div>

                <Badge variant={getScoreBadge(result.score).variant} className="px-3 py-1 text-xs font-bold uppercase">
                  {getScoreBadge(result.score).label}
                </Badge>
              </Card>

              {/* Strengths & Weaknesses Quick Overview */}
              <Card className="lg:col-span-2 p-6 md:p-8 border border-border-light dark:border-border-dark bg-white dark:bg-card-dark shadow-md text-left flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                    Key Evaluation Breakdown
                  </h3>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                    Summary of top qualities and primary improvement vectors.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Strengths */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <span>✓</span> Key Strengths ({result.strengths.length})
                    </h4>
                    <ul className="space-y-2">
                      {result.strengths.map((item, idx) => (
                        <li key={idx} className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-relaxed flex items-start gap-2">
                          <span className="text-emerald-500 font-bold flex-shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <span>⚠️</span> Areas for Improvement ({result.weaknesses.length})
                    </h4>
                    <ul className="space-y-2">
                      {result.weaknesses.map((item, idx) => (
                        <li key={idx} className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-relaxed flex items-start gap-2">
                          <span className="text-amber-500 font-bold flex-shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {result.scoreReason.length > 0 && (
                  <div className="border-t border-border-light dark:border-border-dark pt-5 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Why this score</h4>
                    <ul className="space-y-2">
                      {result.scoreReason.map((reason, index) => (
                        <li key={index} className="text-xs text-text-secondary-light dark:text-text-secondary-dark flex gap-2"><span className="text-primary">•</span>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            </div>

            {/* Detailed Lists Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Missing Keywords List */}
              <Card className="p-6 md:p-8 border border-border-light dark:border-border-dark bg-white dark:bg-card-dark shadow-md text-left space-y-4">
                <h3 className="text-base font-bold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
                  🏷️ Missing Keywords & Skills ({result.missingKeywords.length})
                </h3>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  Consider incorporating these high-value industry terms into your resume content:
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {result.missingKeywords.length > 0 ? (
                    result.missingKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 text-xs font-semibold rounded-lg"
                      >
                        + {kw}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-emerald-600 font-medium">✓ No major keywords missing!</span>
                  )}
                </div>
              </Card>

              {/* Formatting & Structure */}
              <Card className="p-6 md:p-8 border border-border-light dark:border-border-dark bg-white dark:bg-card-dark shadow-md text-left space-y-4">
                <h3 className="text-base font-bold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
                  📄 Formatting & Readability Recommendations ({result.formattingIssues.length})
                </h3>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  Structural changes to enhance automatic parser extraction:
                </p>
                <ul className="space-y-2.5 pt-1">
                  {result.formattingIssues.map((issue, i) => (
                    <li key={i} className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-relaxed flex items-start gap-2.5">
                      <span className="text-primary dark:text-blue-400 font-bold flex-shrink-0">→</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}
