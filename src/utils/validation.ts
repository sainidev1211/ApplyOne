import { z } from 'zod';

/**
 * Reusable password strength validation
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Multi-Step Signup Form Validation Schema
 */
export const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name is required'),
    email: z.string().trim().email('Please enter a valid email address'),
    phone: z.string().trim().min(7, 'Please enter a valid phone number'),
    accountType: z.enum(['STUDENT', 'FRESHER', 'PROFESSIONAL']),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    hasExperience: z.boolean(),
    companyName: z.string().optional(),
    roleDetails: z.string().optional(),

    // Step 3: Employment Type Selection
    selectedEmploymentType: z.enum(['FULL_TIME', 'PART_TIME', 'INTERNSHIP']).optional(),
    lastMonthlyPackage: z.string().optional(),
    expectedPackage: z.string().optional(),

    // Deprecated fields kept for compatibility
    employmentTypesText: z.string().optional(),
    expectedPackageFullTime: z.string().optional(),
    expectedPackagePartTime: z.string().optional(),
    expectedPackageInternship: z.string().optional(),

    // Step 4: Disclaimers
    acceptDisclaimer: z.boolean().refine(Boolean, 'You must accept the disclaimer to register'),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Passwords do not match', path: ['confirmPassword'] });
    }
    // If experience is checked, validate company details and last package
    if (data.hasExperience) {
      if (!data.companyName || data.companyName.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Company name is required when you have experience',
          path: ['companyName'],
        });
      }
      if (!data.roleDetails || data.roleDetails.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Role details description is required when you have experience',
          path: ['roleDetails'],
        });
      }
      if (!data.lastMonthlyPackage || data.lastMonthlyPackage.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Last job package is required when you have experience',
          path: ['lastMonthlyPackage'],
        });
      }
    }

    // If employment type is selected, validate expected package for that type
    if (data.selectedEmploymentType) {
      if (!data.expectedPackage || data.expectedPackage.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Expected package for ${data.selectedEmploymentType.replace('_', ' ').toLowerCase()} is required`,
          path: ['expectedPackage'],
        });
      }
    }
  });

/**
 * Login Form Validation Schema
 */
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Forgot Password Validation Schema
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

/**
 * Reset Password Validation Schema
 */
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
