import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/config/appConfig';
import { toast } from '@/store/toastStore';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { SEO } from '@/components/shared/SEO';
import { Upload, Sparkles } from 'lucide-react';

const completeProfileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters.'),
  phone: z.string().min(8, 'Please enter a valid phone number.'),
  accountType: z.enum(['STUDENT', 'FRESHER', 'PROFESSIONAL']),
  hasExperience: z.boolean().optional().transform((v) => v ?? false),
  companyName: z.string().optional(),
  roleDetails: z.string().optional(),
  lastMonthlyPackage: z.string().optional(),
  selectedEmploymentType: z.enum(['FULL_TIME', 'PART_TIME', 'INTERNSHIP'], {
    message: 'Please select your preferred employment type',
  }),
  expectedPackage: z.string().min(1, 'Please enter your expected monthly package.'),
});

type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
type FormValues = {
  fullName: string;
  phone: string;
  accountType: 'STUDENT' | 'FRESHER' | 'PROFESSIONAL';
  hasExperience: boolean;
  companyName?: string;
  roleDetails?: string;
  lastMonthlyPackage?: string;
  selectedEmploymentType: 'FULL_TIME' | 'PART_TIME' | 'INTERNSHIP';
  expectedPackage: string;
};

export default function CompleteProfile() {
  const { profile, completeProfile, loading } = useAuthStore();
  const navigate = useNavigate();
  const [resume, setResume] = useState<File | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(completeProfileSchema) as any,
    defaultValues: {
      fullName: profile?.full_name || '',
      phone: profile?.phone || '',
      accountType: (profile?.account_type as any) || 'STUDENT',
      hasExperience: false,
      selectedEmploymentType: 'FULL_TIME',
      expectedPackage: '',
    },
  });

  const hasExperience = watch('hasExperience');
  const selectedEmploymentType = watch('selectedEmploymentType');

  const onSubmit = async (data: FormValues) => {
    const body = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      body.append(key, String(value ?? ''));
    });
    if (resume) {
      body.append('resume', resume);
    }

    const result = await completeProfile(body);
    if (result.success) {
      toast.success('Your profile is complete! Welcome to your dashboard.', 'Setup Complete');
      navigate(ROUTES.DASHBOARD, { replace: true });
    } else {
      toast.error(result.error || 'Failed to complete profile.', 'Error');
    }
  };

  return (
    <>
      <SEO title="Complete Your Profile" description="Finalize your ApplyOne candidate profile to match job opportunities." />
      <div className="space-y-6 text-left">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full text-primary mb-1">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Complete Your Profile
          </h2>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Tell us about your target roles and compensation to enable automatic job matching.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              autoComplete="name"
              error={errors.fullName?.message}
              {...register('fullName')}
            />

            <Input
              label="Phone Number"
              type="tel"
              autoComplete="tel"
              placeholder="+91 9876543210"
              error={errors.phone?.message}
              {...register('phone')}
            />

            <div className="space-y-1 md:col-span-2">
              <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                Candidate Category
              </label>
              <select
                className="w-full h-10 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-card-dark text-text-primary-light dark:text-text-primary-dark px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                {...register('accountType')}
              >
                <option value="STUDENT">Student</option>
                <option value="FRESHER">Fresher</option>
                <option value="PROFESSIONAL">Professional</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 border-t border-border-light dark:border-border-dark pt-5">
            <Checkbox
              label="I have previous professional work experience"
              {...register('hasExperience')}
            />

            {hasExperience && (
              <div className="space-y-4 pl-1">
                <Input
                  label="Current or Most Recent Company"
                  placeholder="e.g. Acme Corp"
                  error={errors.companyName?.message}
                  {...register('companyName')}
                />
                <TextArea
                  label="Role Details / Tech Stack"
                  placeholder="e.g. Full Stack Developer specializing in React and Node.js"
                  error={errors.roleDetails?.message}
                  {...register('roleDetails')}
                />
                <Input
                  label="Last Monthly Package (INR)"
                  type="number"
                  placeholder="e.g. 50000"
                  error={errors.lastMonthlyPackage?.message}
                  {...register('lastMonthlyPackage')}
                />
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                Select Preferred Employment Type
              </label>
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
                label={`Expected ${selectedEmploymentType.replace('_', ' ').toLowerCase()} monthly package (INR)`}
                type="number"
                placeholder="e.g. 60000"
                error={errors.expectedPackage?.message}
                {...register('expectedPackage')}
              />
            )}

            <div className="space-y-3">
              <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                Upload Resume (PDF, DOCX)
              </label>
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
                  id="resume-profile-upload"
                />
                <label
                  htmlFor="resume-profile-upload"
                  className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-border-light dark:border-border-dark rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all"
                >
                  <Upload className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                      {resumeFileName || 'Click to upload resume'}
                    </p>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      PDF, DOC, or DOCX up to 10 MB
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <Button type="submit" variant="gradient" className="w-full h-11" loading={loading}>
            Save & Continue to Dashboard
          </Button>
        </form>
      </div>
    </>
  );
}
