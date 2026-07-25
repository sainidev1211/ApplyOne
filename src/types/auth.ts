import { ServiceResponse } from './services';
import { AccountType, UserRole } from '@/config/appConfig';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  account_type: AccountType;
  role: UserRole;
  resume_url?: string | null;
  has_experience?: boolean;
  company_name?: string | null;
  role_details?: string | null;
  employment_types?: string[];
  last_monthly_package?: number | null;
  expected_packages?: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    email_confirmed_at?: string;
  } | null;
  session: any | null;
}

export interface IAuthService {
  signUp(
    email: string,
    password: string,
    metadata: Record<string, any>
  ): Promise<ServiceResponse<AuthSession>>;

  signIn(email: string, password: string): Promise<ServiceResponse<AuthSession>>;

  signOut(): Promise<ServiceResponse<void>>;

  getCurrentUser(): Promise<ServiceResponse<AuthSession['user']>>;

  resendVerificationEmail(email: string): Promise<ServiceResponse<void>>;

  sendPasswordResetEmail(email: string): Promise<ServiceResponse<void>>;

  updatePassword(password: string): Promise<ServiceResponse<void>>;
}

export interface IProfileService {
  getProfile(userId: string): Promise<ServiceResponse<UserProfile>>;
  updateProfile(profile: Partial<UserProfile> & { id: string }): Promise<ServiceResponse<UserProfile>>;
}
