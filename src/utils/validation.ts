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
    // Step 1: Identity & Credentials
    email: z.string().email('Please enter a valid email address'),
    password: passwordSchema,

    // Step 2: Documents & Work Experience
    hasExperience: z.boolean(),
    companyName: z.string().optional(),
    roleDetails: z.string().optional(),

    // Step 3: Employment Preferences & Packages
    employmentTypes: z
      .array(z.enum(['Full-time', 'Part-time', 'Internship']))
      .min(1, 'Select at least one type of employment preferred'),
    lastMonthlyPackage: z.string().optional(),
    expectedPackageFullTime: z.string().optional(),
    expectedPackagePartTime: z.string().optional(),
    expectedPackageInternship: z.string().optional(),

    // Step 4: Disclaimers
    acceptDisclaimer: z.literal(true, {
      message: 'You must accept the disclaimer to register',
    }),
  })
  .superRefine((data, ctx) => {
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

    // Dynamic Expected Package Validation based on selected employmentTypes
    if (data.employmentTypes.includes('Full-time')) {
      if (!data.expectedPackageFullTime || data.expectedPackageFullTime.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Expected package for Full-time is mandatory',
          path: ['expectedPackageFullTime'],
        });
      }
    }

    if (data.employmentTypes.includes('Part-time')) {
      if (!data.expectedPackagePartTime || data.expectedPackagePartTime.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Expected package for Part-time is mandatory',
          path: ['expectedPackagePartTime'],
        });
      }
    }

    if (data.employmentTypes.includes('Internship')) {
      if (!data.expectedPackageInternship || data.expectedPackageInternship.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Expected package for Internship is mandatory',
          path: ['expectedPackageInternship'],
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
