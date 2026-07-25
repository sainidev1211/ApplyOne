import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { signupSchema, SignupInput } from '@/utils/validation';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/config/appConfig';
import { toast } from '@/store/toastStore';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { Card } from '@/components/ui/Card';
import { SEO } from '@/components/shared/SEO';

export default function Signup() {
  const { signUp, loading } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Resume File State
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      hasExperience: false,
      companyName: '',
      roleDetails: '',
      employmentTypes: [],
      lastMonthlyPackage: '',
      expectedPackageFullTime: '',
      expectedPackagePartTime: '',
      expectedPackageInternship: '',
      acceptDisclaimer: undefined,
    },
    mode: 'onTouched',
  });

  // Watch variables for conditional visibility and step validation
  const watchHasExperience = watch('hasExperience');
  const watchEmploymentTypes = watch('employmentTypes') || [];
  const watchPassword = watch('password');
  const watchEmail = watch('email');
  const watchCompanyName = watch('companyName');
  const watchRoleDetails = watch('roleDetails');
  const watchLastMonthlyPackage = watch('lastMonthlyPackage');
  const watchExpectedPackageFullTime = watch('expectedPackageFullTime');
  const watchExpectedPackagePartTime = watch('expectedPackagePartTime');
  const watchExpectedPackageInternship = watch('expectedPackageInternship');
  const watchAcceptDisclaimer = watch('acceptDisclaimer');

  const isStepComplete = () => {
    if (step === 1) {
      if (!watchEmail || !watchPassword) return false;
      const isPasswordStrong =
        watchPassword.length >= 8 &&
        /[A-Z]/.test(watchPassword) &&
        /[a-z]/.test(watchPassword) &&
        /[0-9]/.test(watchPassword);
      const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(watchEmail);
      return isPasswordStrong && isEmailValid;
    }
    
    if (step === 2) {
      if (!resumeFile) return false;
      if (watchHasExperience) {
        if (!watchCompanyName || watchCompanyName.trim() === '') return false;
        if (!watchRoleDetails || watchRoleDetails.trim() === '') return false;
      }
      return true;
    }
    
    if (step === 3) {
      if (!watchEmploymentTypes || watchEmploymentTypes.length === 0) return false;
      if (watchHasExperience) {
        if (!watchLastMonthlyPackage || watchLastMonthlyPackage.trim() === '') return false;
      }
      if (watchEmploymentTypes.includes('Full-time')) {
        if (!watchExpectedPackageFullTime || watchExpectedPackageFullTime.trim() === '') return false;
      }
      if (watchEmploymentTypes.includes('Part-time')) {
        if (!watchExpectedPackagePartTime || watchExpectedPackagePartTime.trim() === '') return false;
      }
      if (watchEmploymentTypes.includes('Internship')) {
        if (!watchExpectedPackageInternship || watchExpectedPackageInternship.trim() === '') return false;
      }
      return true;
    }
    
    if (step === 4) {
      return !!watchAcceptDisclaimer;
    }
    
    return false;
  };

  // Handle Resume selection and validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB limit
    
    if (file.size > maxSizeBytes) {
      setResumeError('Resume file size exceeds the 5MB limit.');
      setResumeFile(null);
      return;
    }

    setResumeError(null);
    setResumeFile(file);
    toast.success(`Successfully uploaded ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`, 'File Accepted');
  };

  // Step-by-Step validation before advancing
  const nextStep = async () => {
    let fieldsToValidate: Array<keyof SignupInput> = [];
    
    if (step === 1) {
      fieldsToValidate = ['email', 'password'];
    } else if (step === 2) {
      if (!resumeFile) {
        setResumeError('Resume upload is required to continue.');
        return;
      }
      fieldsToValidate = ['hasExperience'];
      if (watchHasExperience) {
        fieldsToValidate.push('companyName', 'roleDetails');
      }
    } else if (step === 3) {
      fieldsToValidate = ['employmentTypes'];
      if (watchHasExperience) {
        fieldsToValidate.push('lastMonthlyPackage');
      }
      if (watchEmploymentTypes.includes('Full-time')) {
        fieldsToValidate.push('expectedPackageFullTime');
      }
      if (watchEmploymentTypes.includes('Part-time')) {
        fieldsToValidate.push('expectedPackagePartTime');
      }
      if (watchEmploymentTypes.includes('Internship')) {
        fieldsToValidate.push('expectedPackageInternship');
      }
    }

    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid && (step !== 2 || resumeFile)) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  // Final submit handler on step 4
  const onSubmit = async (data: SignupInput) => {
    const metadata = {
      full_name: 'Candidate User',
      resume_url: resumeFile ? `https://storage.applyone.co/resumes/${resumeFile.name}` : null,
      has_experience: data.hasExperience,
      company_name: data.hasExperience ? data.companyName : null,
      role_details: data.hasExperience ? data.roleDetails : null,
      employment_types: data.employmentTypes,
      last_monthly_package: data.hasExperience ? parseFloat(data.lastMonthlyPackage || '0') : null,
      expected_packages: {
        ...(data.employmentTypes.includes('Full-time') ? { 'Full-time': data.expectedPackageFullTime } : {}),
        ...(data.employmentTypes.includes('Part-time') ? { 'Part-time': data.expectedPackagePartTime } : {}),
        ...(data.employmentTypes.includes('Internship') ? { 'Internship': data.expectedPackageInternship } : {}),
      },
    };

    const res = await signUp(data.email, data.password, metadata);

    if (res.success) {
      toast.success(res.message, 'Account Configured');
      navigate(ROUTES.VERIFY_EMAIL, { state: { email: data.email } });
    } else {
      toast.error(res.error || 'Failed to complete registration.', 'Signup Mismatch');
    }
  };

  // Slide Animation transition presets
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3 },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
      transition: { duration: 0.3 },
    }),
  };

  return (
    <>
      <SEO title="Wizard Registration" description="Complete the ApplyOne candidate onboarding flow." />
      <div className="space-y-6">
        
        {/* Step Indicator Panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-text-secondary-light dark:text-text-secondary-dark font-semibold">
            <span>Progress</span>
            <span>Step {step} of 4</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Wizard Forms */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <AnimatePresence mode="wait" custom={step}>
            
            {/* SCREEN 1: EMAIL & PASSWORD SIGNUP */}
            {step === 1 && (
              <motion.div
                key="step1"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-5 text-left"
              >
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                    Identity Setup
                  </h3>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    Provide your email address and password to start.
                  </p>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    id="email"
                    error={errors.email?.message}
                    {...register('email')}
                  />

                  <Input
                    label="Choose Password"
                    type="password"
                    placeholder="••••••••"
                    id="password"
                    error={errors.password?.message}
                    {...register('password')}
                  />
                  
                  {/* Password Strength Checklist */}
                  <div className="p-3 bg-bg-alt-light dark:bg-bg-alt-dark rounded-lg border border-border-light dark:border-border-dark space-y-1.5 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    <p className="font-semibold text-text-primary-light dark:text-text-primary-dark">Password guidelines:</p>
                    <div className="flex items-center gap-1.5">
                      <span className={watchPassword && watchPassword.length >= 8 ? 'text-green-500' : 'text-slate-400'}>✓</span>
                      <span>At least 8 characters</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={watchPassword && /[A-Z]/.test(watchPassword) ? 'text-green-500' : 'text-slate-400'}>✓</span>
                      <span>One uppercase letter</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={watchPassword && /[a-z]/.test(watchPassword) ? 'text-green-500' : 'text-slate-400'}>✓</span>
                      <span>One lowercase letter</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={watchPassword && /[0-9]/.test(watchPassword) ? 'text-green-500' : 'text-slate-400'}>✓</span>
                      <span>One numeric number</span>
                    </div>
                  </div>
                </div>

                {/* Footer continue actions */}
                <div className="pt-4">
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!isStepComplete()}
                    className="w-full"
                  >
                    Save & Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {/* SCREEN 2: RESUME UPLOAD & WORK EXPERIENCE */}
            {step === 2 && (
              <motion.div
                key="step2"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-5 text-left"
              >
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                    Professional Background
                  </h3>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    Upload your resume file and details of past experience.
                  </p>
                </div>

                {/* File Upload zone */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                    Upload Resume (PDF, Word)
                  </label>
                  <div className="border-2 border-dashed border-border-light dark:border-border-dark rounded-xl p-6 text-center bg-white dark:bg-card-dark hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors relative cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="space-y-1.5 text-text-secondary-light dark:text-text-secondary-dark">
                      <span className="block text-2xl">📄</span>
                      <span className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                        {resumeFile ? resumeFile.name : 'Choose file or drag here'}
                      </span>
                      <span className="block text-xs">PDF or DOCX documents up to 5MB</span>
                    </div>
                  </div>
                  {resumeError && (
                    <p className="text-xs text-red-500 font-semibold">{resumeError}</p>
                  )}
                  {resumeFile && !resumeError && (
                    <p className="text-xs text-green-500 font-medium">✓ Resume file attached successfully.</p>
                  )}
                </div>

                {/* Experience checkbox */}
                <div className="pt-2">
                  <Controller
                    name="hasExperience"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        label="I have previous professional work experience"
                        id="hasExperience"
                        checked={field.value}
                        onChange={(e) => field.onChange((e.target as HTMLInputElement).checked)}
                      />
                    )}
                  />
                </div>

                {/* Conditional Company inputs */}
                {watchHasExperience && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-2"
                  >
                    <Input
                      label="Company Name"
                      placeholder="e.g. Acme Corp"
                      id="companyName"
                      error={errors.companyName?.message}
                      {...register('companyName')}
                    />

                    <TextArea
                      label="Role Details"
                      placeholder="Describe the tasks, technology models, and accomplishments in this role..."
                      id="roleDetails"
                      error={errors.roleDetails?.message}
                      {...register('roleDetails')}
                    />
                  </motion.div>
                )}

                {/* Navigation Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Back
                  </Button>
                  <Button type="button" onClick={nextStep} disabled={!isStepComplete()}>
                    Save & Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {/* SCREEN 3: EMPLOYMENT MODELS & SALARY DYNAMICS */}
            {step === 3 && (
              <motion.div
                key="step3"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-5 text-left"
              >
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                    Employment Match Criteria
                  </h3>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    Indicate the employment types and monthly salary expectations.
                  </p>
                </div>

                {/* Employment preference list */}
                <div className="space-y-2">
                  <span className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                    Preferred Employment Types (Select all that apply)
                  </span>
                  
                  <div className="space-y-2">
                    {['Full-time', 'Part-time', 'Internship'].map((type) => (
                      <div key={type} className="flex items-center">
                        <Controller
                          name="employmentTypes"
                          control={control}
                          render={({ field }) => (
                            <input
                              type="checkbox"
                              id={`emp-${type}`}
                              value={type}
                              checked={field.value?.includes(type as any)}
                              onChange={(e) => {
                                const val = e.target.value as any;
                                const isChecked = e.target.checked;
                                const currentList = field.value || [];
                                
                                if (isChecked) {
                                  field.onChange([...currentList, val]);
                                } else {
                                  field.onChange(currentList.filter((item) => item !== val));
                                }
                              }}
                              className="h-4 w-4 rounded border-border-light dark:border-border-dark text-primary focus:ring-primary dark:bg-card-dark cursor-pointer"
                            />
                          )}
                        />
                        <label htmlFor={`emp-${type}`} className="ml-3 text-sm font-medium text-text-primary-light dark:text-text-primary-dark cursor-pointer select-none">
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                  {errors.employmentTypes && (
                    <p className="text-xs text-red-500 font-semibold">{errors.employmentTypes.message}</p>
                  )}
                </div>

                {/* Conditional Last Job salary package */}
                {watchHasExperience && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pt-2"
                  >
                    <Input
                      label="Last Job's Monthly Salary (USD / month)"
                      type="number"
                      placeholder="e.g. 4000"
                      id="lastMonthlyPackage"
                      error={errors.lastMonthlyPackage?.message}
                      {...register('lastMonthlyPackage')}
                    />
                  </motion.div>
                )}

                {/* Dynamic Expected Packages based on checkbox counts */}
                {watchEmploymentTypes.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 pt-2"
                  >
                    {watchEmploymentTypes.includes('Full-time') && (
                      <Input
                        label="Expected Full-Time Monthly Package (USD)"
                        type="number"
                        placeholder="e.g. 5000"
                        id="expectedPackageFullTime"
                        error={errors.expectedPackageFullTime?.message}
                        {...register('expectedPackageFullTime')}
                      />
                    )}

                    {watchEmploymentTypes.includes('Part-time') && (
                      <Input
                        label="Expected Part-Time Monthly Package (USD)"
                        type="number"
                        placeholder="e.g. 2500"
                        id="expectedPackagePartTime"
                        error={errors.expectedPackagePartTime?.message}
                        {...register('expectedPackagePartTime')}
                      />
                    )}

                    {watchEmploymentTypes.includes('Internship') && (
                      <Input
                        label="Expected Internship Monthly Package (USD)"
                        type="number"
                        placeholder="e.g. 1500"
                        id="expectedPackageInternship"
                        error={errors.expectedPackageInternship?.message}
                        {...register('expectedPackageInternship')}
                      />
                    )}
                  </motion.div>
                )}

                {/* Navigation Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Back
                  </Button>
                  <Button type="button" onClick={nextStep} disabled={!isStepComplete()}>
                    Save & Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {/* SCREEN 4: PLATFORM DISCLAIMER & COMPLETE SUBMISSION */}
            {step === 4 && (
              <motion.div
                key="step4"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-5 text-left"
              >
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                    Terms & Agreement
                  </h3>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    Review and accept the platform dispatch policies to register.
                  </p>
                </div>

                {/* Formal platform disclaimer card */}
                <Card className="bg-slate-50 dark:bg-bg-alt-dark p-5 border border-border-light dark:border-border-dark rounded-xl">
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                    <strong className="block text-text-primary-light dark:text-text-primary-dark mb-1.5 text-sm">
                      ApplyOne Platform Disclaimer
                    </strong>
                    ApplyOne operates strictly as an automated application dispatch platform. We facilitate the distribution and submission of candidate profile credentials to designated employers. ApplyOne does not warrant, promise, or guarantee employment, placement, or hiring outcomes. All recruitment decisions, candidate shortlisting (which is also dependent on the ATS compatibility score of the candidate's resume), and final hiring states depend entirely on candidate qualifications, capability alignments, and employer evaluations.
                  </p>
                </Card>

                {/* Agreement checkbox */}
                <div className="pt-2">
                  <Controller
                    name="acceptDisclaimer"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        label="I acknowledge and accept the ApplyOne dispatch disclaimer policies"
                        id="acceptDisclaimer"
                        checked={!!field.value}
                        onChange={(e) => field.onChange((e.target as HTMLInputElement).checked)}
                        error={errors.acceptDisclaimer?.message}
                      />
                    )}
                  />
                </div>

                {/* Form Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={prevStep} disabled={loading}>
                    Back
                  </Button>
                  <Button type="submit" variant="gradient" loading={loading} disabled={!isStepComplete() || loading}>
                    Complete Sign Up
                  </Button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </form>

        {/* Link back to login */}
        <div className="text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN} className="font-semibold text-primary hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </>
  );
}
