import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { signupSchema, SignupInput } from '@/utils/validation';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/config/appConfig';
import { toast } from '@/store/toastStore';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { SEO } from '@/components/shared/SEO';
import { Upload } from 'lucide-react';
// Google auth removed; no client-side Google helpers required.

export default function Signup() {
  const { signUp, loading } = useAuthStore();
  const navigate = useNavigate();
  const [resume, setResume] = useState<File | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string>('');
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { hasExperience: false, accountType: 'STUDENT', acceptDisclaimer: false, selectedEmploymentType: undefined },
  });
  const hasExperience = watch('hasExperience');
  const selectedEmploymentType = watch('selectedEmploymentType');

  const onSubmit = async (data: SignupInput) => {
    const body = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      body.append(key, Array.isArray(value) ? JSON.stringify(value) : String(value ?? ''));
    });
    if (resume) body.append('resume', resume);
    const result = await signUp(body);
    if (result.success) {
      toast.success('Account created successfully.', 'Welcome to ApplyOne');
      navigate(ROUTES.DASHBOARD, { replace: true });
    } else {
      toast.error(result.error || 'Unable to create your account.', 'Registration failed');
    }
  };

  return (
    <>
      <SEO title="Create Account" description="Create your ApplyOne account." />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-left">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">Create your account</h2>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Your email is your account ID.</p>
        </div>
        {/* Google signup removed — use the form below to create an account. */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Full name" autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
          <Input label="Email (account ID)" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
          <Input label="Phone" type="tel" autoComplete="tel" error={errors.phone?.message} {...register('phone')} />
          <select className="w-full rounded-lg border p-2" {...register('accountType')}>
            <option value="STUDENT">Student</option><option value="FRESHER">Fresher</option><option value="PROFESSIONAL">Professional</option>
          </select>
            <Input label="Password" type="password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
            <Input label="Confirm password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        </div>
        <div className="space-y-4 border-t border-border-light dark:border-border-dark pt-5">
          <Checkbox label="I have previous professional work experience" {...register('hasExperience')} />
          {hasExperience && <>
            <Input label="Current or most recent company" error={errors.companyName?.message} {...register('companyName')} />
            <TextArea label="Role details" error={errors.roleDetails?.message} {...register('roleDetails')} />
            <Input label="Last monthly package" type="number" error={errors.lastMonthlyPackage?.message} {...register('lastMonthlyPackage')} />
          </>}
          
          <div className="space-y-3">
            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark">Select Preferred Employment Type</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'FULL_TIME', label: 'Full Time', icon: '💼' },
                { value: 'PART_TIME', label: 'Part Time', icon: '⏰' },
                { value: 'INTERNSHIP', label: 'Internship', icon: '🎓' },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setValue('selectedEmploymentType', type.value as any)}
                  className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                    selectedEmploymentType === type.value
                      ? 'border-primary bg-primary/10 dark:border-primary dark:bg-primary/20'
                      : 'border-border-light dark:border-border-dark hover:border-primary/50'
                  }`}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
            {errors.selectedEmploymentType && (
              <p className="text-xs text-red-500">{errors.selectedEmploymentType.message}</p>
            )}
          </div>

          {selectedEmploymentType && (
            <Input
              label={`Expected ${selectedEmploymentType.replace('_', ' ').toLowerCase()} monthly package`}
              type="number"
              placeholder="Enter salary amount"
              error={errors.expectedPackage?.message}
              {...register('expectedPackage')}
            />
          )}

          <div className="space-y-3">
            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark">Resume (optional)</label>
            <div className="relative">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setResume(file ?? null);
                  setResumeFileName(file?.name ?? '');
                }}
                className="hidden"
                id="resume-upload"
              />
              <label
                htmlFor="resume-upload"
                className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-border-light dark:border-border-dark rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all"
              >
                <Upload className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
                <div className="text-left">
                  <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                    {resumeFileName || 'Click to upload resume'}
                  </p>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    PDF, DOC, or DOCX
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
        <Checkbox label="I accept the ApplyOne platform terms and disclaimer" error={errors.acceptDisclaimer?.message} {...register('acceptDisclaimer')} />
        <Button type="submit" className="w-full" loading={loading}>Create Account</Button>
        <p className="text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">Already have an account? <Link to={ROUTES.LOGIN} className="font-semibold text-primary hover:underline">Sign in</Link></p>
      </form>
    </>
  );
}
