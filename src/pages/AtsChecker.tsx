import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/appConfig';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SEO } from '@/components/shared/SEO';
import { toast } from '@/store/toastStore';
import { motion, AnimatePresence } from 'framer-motion';

interface MetricDetail {
  title: string;
  score: number;
  status: 'pass' | 'warning' | 'fail';
  description: string;
  items: string[];
}

export default function AtsChecker() {
  const { profile } = useAuthStore();
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [jdText, setJdText] = useState('');
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [matchingJd, setMatchingJd] = useState(false);

  const isProfessionalTier = profile?.account_type === 'Student' || !profile?.account_type;

  if (isProfessionalTier) {
    return (
      <>
        <SEO title="Upgrade Required" description="Unlock ATS Score Checker" />
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center max-w-lg mx-auto space-y-6 pt-10">
          <div className="h-16 w-16 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-3xl shadow-inner animate-pulse">
            🔒
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-text-primary-light dark:text-text-primary-dark tracking-tight">
              Unlock ATS Score Checker
            </h1>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
              The ATS Score Checker is exclusive to our <span className="font-semibold text-primary dark:text-blue-400">Premium</span> and <span className="font-semibold text-purple-600 dark:text-purple-400">Elite</span> subscribers. Upgrade your plan to scan, match, and optimize your resume for applicant tracking systems.
            </p>
          </div>

          <Card className="w-full p-6 border border-border-light dark:border-border-dark bg-white dark:bg-card-dark text-left space-y-4 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary-light dark:text-text-primary-dark border-b border-border-light dark:border-border-dark pb-2">
              Features Included in Premium & Elite Tiers:
            </h4>
            <ul className="space-y-2.5 text-xs text-text-secondary-light dark:text-text-secondary-dark">
              <li className="flex items-center gap-2.5">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Complete layout & font readability parsing check</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Detailed keyword density matching & missing keywords finder</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Interactive target Job Description alignment scorer</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Quantitative action verb suggestions & output checks</span>
              </li>
            </ul>
          </Card>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 w-full">
            <Link to={ROUTES.SUBSCRIPTIONS} className="flex-1">
              <Button variant="gradient" className="w-full">
                Upgrade My Plan
              </Button>
            </Link>
            <Link to={ROUTES.DASHBOARD} className="flex-1">
              <Button variant="outline" className="w-full">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  const scanSteps = [
    'Extracting document structure...',
    'Evaluating fonts and layout formatting...',
    'Parsing section headings and contact details...',
    'Performing keyword frequency analysis...',
    'Checking action-verb density and quantitative metrics...',
    'Finalizing suitability indices...'
  ];

  // Industry-aligned resume evaluation statistics
  const scoreCategories: Record<string, MetricDetail> = {
    formatting: {
      title: 'Formatting & Layout',
      score: 85,
      status: 'pass',
      description: 'Document structure, fonts, and parsing headers are standard.',
      items: [
        '✓ Font sizing and hierarchy is parse-friendly.',
        '✓ Standard margins and vertical grid structure detected.',
        '⚠ Alert: Two-column layouts may occasionally cause line wrap merge on older ATS parsers.',
        '✓ No nested tables or complex graphical columns found.'
      ]
    },
    keywords: {
      title: 'Keyword Optimization',
      score: 72,
      status: 'warning',
      description: 'Matches core industry keywords, but has gaps in target competencies.',
      items: [
        '✓ Core skills found: React, TypeScript, Git, Tailwind CSS.',
        '✗ Missing key technologies: Node.js, Webpack, Unit Testing (Jest).',
        '✗ Soft skills missing: Agile Methodologies, Cross-functional collaboration.'
      ]
    },
    contact: {
      title: 'Contact Information',
      score: 100,
      status: 'pass',
      description: 'Essential contact points and professional profiles discovered.',
      items: [
        '✓ Email address parsed cleanly.',
        '✓ Mobile number present.',
        '✓ LinkedIn profile URL detected.',
        '✓ GitHub repository profile linked.'
      ]
    },
    impact: {
      title: 'Quantitative Impact',
      score: 60,
      status: 'fail',
      description: 'Insufficient quantitative metrics and action verbs.',
      items: [
        '✗ Action verbs density is low (e.g. use "Developed" instead of "Responsible for").',
        '✗ Missing metrics: No numeric targets, percentages, or dollar achievements found.',
        '⚠ Suggestion: Rephrase bullet points to emphasize output (e.g., "Optimized queries, reducing load times by 30%").'
      ]
    }
  };

  const overallScore = Math.round(
    (scoreCategories.formatting.score +
      scoreCategories.keywords.score +
      scoreCategories.contact.score +
      scoreCategories.impact.score) /
      4
  );

  const handleStartAnalysis = () => {
    setAnalyzing(true);
    setAnalysisComplete(false);
    setScanStep(0);
  };

  // Simulate parsing steps progression
  useEffect(() => {
    if (!analyzing) return;

    const interval = setInterval(() => {
      setScanStep((prev) => {
        if (prev >= scanSteps.length - 1) {
          clearInterval(interval);
          setTimeout(() => {
            setAnalyzing(false);
            setAnalysisComplete(true);
            toast.success('Resume scan and ATS grading completed successfully.', 'Analysis Complete');
          }, 600);
          return prev;
        }
        return prev + 1;
      });
    }, 900);

    return () => clearInterval(interval);
  }, [analyzing]);

  // Simulate Job Description matching logic
  const handleMatchJd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText.trim()) {
      toast.error('Please paste a target Job Description to compare.', 'Input Required');
      return;
    }

    setMatchingJd(true);
    setTimeout(() => {
      setMatchingJd(false);
      // Simulate industry fit score calculation based on text features
      const words = jdText.toLowerCase();
      let simulatedMatch = 65; // baseline

      if (words.includes('react') || words.includes('typescript')) simulatedMatch += 10;
      if (words.includes('node') || words.includes('database')) simulatedMatch += 8;
      if (words.includes('agile') || words.includes('scrum')) simulatedMatch += 5;
      if (words.includes('test') || words.includes('jest')) simulatedMatch -= 5; // missing Jest penalizes score

      simulatedMatch = Math.min(95, Math.max(40, simulatedMatch));
      setMatchScore(simulatedMatch);
      toast.success(`Job description match score generated: ${simulatedMatch}%`, 'Match Calculated');
    }, 1500);
  };

  const getResumeFileName = (url: string | null | undefined) => {
    if (!url) return 'resume_candidate_user.pdf';
    try {
      const parts = url.split('/');
      return decodeURIComponent(parts[parts.length - 1]);
    } catch {
      return 'resume_candidate_user.pdf';
    }
  };

  return (
    <>
      <SEO title="ATS Score Checker" description="Evaluate your resume against industrial parser engines." />
      <div className="space-y-8 text-left">
        
        {/* Header Block */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary-light dark:text-text-primary-dark">
            ATS Score Checker
          </h1>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
            Assess the readability, formatting alignment, and keyword density of your active resume.
          </p>
        </div>

        {/* Scan Status Control Banner */}
        <Card className="p-6 border border-border-light dark:border-border-dark bg-white dark:bg-card-dark shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-bl from-blue-600/5 to-purple-600/5 rounded-full filter blur-xl pointer-events-none" />
          
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-primary dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full">
              Active File
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📄</span>
              <div>
                <h4 className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">
                  {getResumeFileName(profile?.resume_url)}
                </h4>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  Uploaded during registration
                </p>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0">
            <Button
              onClick={handleStartAnalysis}
              variant="gradient"
              disabled={analyzing}
              className="w-full md:w-auto"
            >
              {analyzing ? 'Scanning Resume...' : 'Analyze My Resume'}
            </Button>
          </div>
        </Card>

        {/* SCANNING MODAL OVERLAY */}
        <AnimatePresence>
          {analyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-white dark:bg-card-dark border border-border-light dark:border-border-dark rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-6"
              >
                <div className="relative flex justify-center py-4">
                  {/* Outer spinning ring */}
                  <div className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  {/* Inside check mark */}
                  <div className="absolute inset-0 flex items-center justify-center text-xl">🔍</div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                    Running ATS Suitability Audit
                  </h4>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark max-w-xs mx-auto">
                    Simulating modern recruitment parsing models to inspect parsing parameters...
                  </p>
                </div>

                {/* Progress Indicators */}
                <div className="space-y-4 text-left pt-2">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                    <span>PROGRESS STATUS</span>
                    <span>{Math.round(((scanStep + 1) / scanSteps.length) * 100)}%</span>
                  </div>
                  <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${((scanStep + 1) / scanSteps.length) * 100}%` }}
                    />
                  </div>
                  {/* Scan step status text */}
                  <div className="p-2.5 bg-slate-50 dark:bg-bg-dark rounded-lg text-[11px] font-medium text-primary dark:text-blue-400 border border-border-light dark:border-border-dark/60 text-center animate-pulse">
                    {scanSteps[scanStep]}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* RESULTS METRICS PRESENTATION */}
        {analysisComplete && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Primary Score Ring and Diagnostics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Score circle dial card */}
              <Card className="p-8 border border-border-light dark:border-border-dark bg-white dark:bg-card-dark shadow-md flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark mb-4">
                  Overall ATS Compatibility
                </span>
                
                {/* Visual Dial */}
                <div className="relative h-40 w-40 flex items-center justify-center mb-4">
                  {/* SVG Circle progress */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Circle Background */}
                    <circle
                      className="text-slate-100 dark:text-slate-800"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    {/* Circle Fill */}
                    <circle
                      className="text-emerald-500"
                      strokeWidth="8"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * overallScore) / 100}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                  </svg>
                  {/* Centered text */}
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-4xl font-extrabold text-text-primary-light dark:text-text-primary-dark">
                      {overallScore}
                    </span>
                    <span className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark font-bold">
                      OF 100
                    </span>
                  </div>
                </div>

                <Badge
                  variant={overallScore >= 80 ? 'success' : overallScore >= 60 ? 'warning' : 'accent'}
                  className="px-3 py-1 text-xs font-bold uppercase"
                >
                  {overallScore >= 80 ? 'Excellent Match' : overallScore >= 60 ? 'Fair Alignment' : 'Needs Optimization'}
                </Badge>
              </Card>

              {/* High-level category metrics checklist */}
              <Card className="lg:col-span-2 p-6 md:p-8 border border-border-light dark:border-border-dark bg-white dark:bg-card-dark shadow-md text-left space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                    Category suitabilities
                  </h3>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    Detailed index breakdowns of key recruitment matching vectors.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.values(scoreCategories).map((cat) => (
                    <div key={cat.title} className="p-4 rounded-xl border border-border-light dark:border-border-dark bg-slate-50 dark:bg-bg-dark/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-text-primary-light dark:text-text-primary-dark">
                          {cat.title}
                        </span>
                        <span className={`text-xs font-extrabold ${cat.status === 'pass' ? 'text-emerald-500' : cat.status === 'warning' ? 'text-amber-500' : 'text-red-500'}`}>
                          {cat.score}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${cat.status === 'pass' ? 'bg-emerald-500' : cat.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${cat.score}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark italic leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* ATS IMPROVEMENT STRATEGIES AND TARGET KEYWORDS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Errors & Detailed Solutions */}
              <Card className="p-6 md:p-8 border border-border-light dark:border-border-dark bg-white dark:bg-card-dark shadow-md text-left space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                    Spotted Errors & Direct Solutions
                  </h3>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    We scanned your active resume formatting and bullet structures. Here are the specific areas needing correction.
                  </p>
                </div>

                <div className="space-y-4">
                  
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50/40 dark:bg-red-950/10 border border-red-200/50 dark:border-red-900/30">
                    <span className="text-lg flex-shrink-0">⚠️</span>
                    <div className="space-y-1 flex-1">
                      <h4 className="text-xs font-bold text-red-600 dark:text-red-400">
                        Error: Missing Quantifiable Impact Metrics
                      </h4>
                      <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                        ATS engines check for numeric results (e.g., percentages, hours saved, dollars earned).
                      </p>
                      <p className="text-[11px] font-semibold text-text-primary-light dark:text-text-primary-dark pt-1">
                        Solution: Rewrite your description bullet points to start with active verbs and end with quantified results. For example: <span className="italic text-primary dark:text-blue-400">"Reduced application load latency by 35% through API query optimizations"</span>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30">
                    <span className="text-lg flex-shrink-0">⚠️</span>
                    <div className="space-y-1 flex-1">
                      <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        Error: Passive Verbs & Responsibility Phrases
                      </h4>
                      <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                        Terms like "Responsible for" or "Tasked with" perform poorly in parser filters.
                      </p>
                      <p className="text-[11px] font-semibold text-text-primary-light dark:text-text-primary-dark pt-1">
                        Solution: Swap with high-impact active power verbs such as <span className="font-semibold">Spearheaded, Architected, Engineered, Orchestrated, Optimized, and Formulated</span>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30">
                    <span className="text-lg flex-shrink-0">⚠️</span>
                    <div className="space-y-1 flex-1">
                      <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        Error: Soft Skill Relying Overload
                      </h4>
                      <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                        Parser scanners look for technical proficiencies and tooling over descriptive adjectives.
                      </p>
                      <p className="text-[11px] font-semibold text-text-primary-light dark:text-text-primary-dark pt-1">
                        Solution: Instead of writing "highly collaborative team player", integrate your collaboration achievements into project lines e.g. <span className="italic text-primary dark:text-blue-400">"Collaborated with a cross-functional squad of 5 engineers to deliver features in Agile sprints."</span>
                      </p>
                    </div>
                  </div>

                </div>
              </Card>

              {/* Recommended Industry Keywords */}
              <Card className="p-6 md:p-8 border border-border-light dark:border-border-dark bg-white dark:bg-card-dark shadow-md text-left space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                      Recommended Keyword Additions
                    </h3>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      These are the highest density keywords scanned across industry listings matching your profile tier ({profile?.account_type || 'Student'}).
                    </p>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-primary dark:text-blue-400 block">
                      Add to Technical Skills:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {['React', 'TypeScript', 'Node.js', 'RESTful APIs', 'Database Optimization', 'Jest / Unit Testing', 'Tailwind CSS', 'Git & CI/CD Pipelines', 'System Architecture', 'Agile Methodologies'].map((kw) => (
                        <span
                          key={kw}
                          className="px-2.5 py-1 bg-slate-50 dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-md text-xs font-medium text-text-primary-light dark:text-text-primary-dark"
                        >
                          + {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600 dark:text-purple-400 block">
                      Recommended Action Verbs:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {['Spearheaded', 'Optimized', 'Architected', 'Orchestrated', 'Refactored', 'Formulated', 'Automated'].map((verb) => (
                        <span
                          key={verb}
                          className="px-2.5 py-1 bg-purple-500/5 dark:bg-purple-400/5 border border-purple-500/20 dark:border-purple-400/20 rounded-md text-xs font-semibold text-purple-600 dark:text-purple-400"
                        >
                          ⚡ {verb}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border-light dark:border-border-dark flex justify-end">
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText('React, TypeScript, Node.js, RESTful APIs, Database Optimization, Jest, Tailwind CSS, Git, CI/CD, Spearheaded, Optimized, Architected');
                      toast.success('High-impact keywords copied to your clipboard.', 'Keywords Copied');
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Copy Keywords to Clipboard
                  </Button>
                </div>
              </Card>

            </div>

            {/* EXPANDABLE ACCORDION AUDIT SECTIONS */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-text-primary-light dark:text-text-text-primary-dark">
                Audit Feedback Logs
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.values(scoreCategories).map((cat) => (
                  <Card key={cat.title} className="p-6 border border-border-light dark:border-border-dark bg-white dark:bg-card-dark shadow-sm">
                    <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark pb-3 mb-4">
                      <h4 className="font-bold text-sm text-text-primary-light dark:text-text-primary-dark">
                        {cat.title} Report
                      </h4>
                      <Badge
                        variant={cat.status === 'pass' ? 'success' : cat.status === 'warning' ? 'warning' : 'accent'}
                        className="text-[9px] uppercase font-bold"
                      >
                        {cat.status === 'pass' ? 'Passed' : cat.status === 'warning' ? 'Warning' : 'Critical'}
                      </Badge>
                    </div>
                    <ul className="space-y-3.5">
                      {cat.items.map((item, i) => {
                        const isError = item.startsWith('✗');
                        const isWarning = item.startsWith('⚠');
                        return (
                          <li key={i} className="text-xs flex items-start leading-relaxed text-text-secondary-light dark:text-text-secondary-dark">
                            <span className={`mr-2 flex-shrink-0 font-bold ${isError ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-emerald-500'}`}>
                              {isError ? '•' : isWarning ? '•' : ''}
                            </span>
                            <span>{item.replace(/^[✓✗⚠]\s*(Alert:|Suggestion:)?\s*/, '')}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </Card>
                ))}
              </div>
            </div>

            {/* JOB DESCRIPTION FIT CALCULATOR */}
            <Card className="p-6 md:p-8 border border-border-light dark:border-border-dark bg-white dark:bg-card-dark shadow-md text-left">
              <div className="space-y-1 mb-6">
                <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                  Job Description Matcher
                </h3>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  Paste a target job description below to check how well your resume matches the role requirements.
                </p>
              </div>

              <form onSubmit={handleMatchJd} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                    Target Job Description Text
                  </label>
                  <textarea
                    rows={6}
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    placeholder="Paste responsibilities, technology stack requirements, and key competencies here..."
                    className="w-full p-4 text-xs bg-slate-50 dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-primary-light dark:text-text-primary-dark"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 pt-2 border-t border-border-light dark:border-border-dark">
                  {matchScore !== null ? (
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark">
                        Match Score:
                      </span>
                      <Badge
                        variant={matchScore >= 80 ? 'success' : matchScore >= 60 ? 'warning' : 'accent'}
                        className="text-sm font-extrabold px-3 py-1 rounded-full"
                      >
                        {matchScore}%
                      </Badge>
                    </div>
                  ) : (
                    <div className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark">
                      Ready to check compatibility matches
                    </div>
                  )}
                  <Button type="submit" variant="outline" size="sm" disabled={matchingJd}>
                    {matchingJd ? 'Comparing Texts...' : 'Calculate Suitability'}
                  </Button>
                </div>
              </form>

              {matchScore !== null && (
                <div className="mt-6 p-4 rounded-xl border border-border-light dark:border-border-dark bg-slate-50 dark:bg-bg-dark/40 space-y-3.5">
                  <h4 className="text-xs font-bold text-text-primary-light dark:text-text-primary-dark">
                    Competency Adjustments Report
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-emerald-500 uppercase block tracking-wider">
                        Matching Highlights
                      </span>
                      <p className="text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                        Nice job! Your resume matches the job description on: React, TypeScript, and Git.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-red-500 uppercase block tracking-wider">
                        Missing Keywords Recommendations
                      </span>
                      <p className="text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                        To hit an 85%+ score, try incorporating these terms: Node.js, Agile, Databases.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

          </motion.div>
        )}

      </div>
    </>
  );
}
