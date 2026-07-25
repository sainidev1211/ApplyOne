import { supabase } from './client';
import { IProfileService, UserProfile } from '@/types/auth';
import { ServiceResponse } from '@/types/services';
import { loggingService } from '../logging/loggingService';

const isSimulation =
  !import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

class SupabaseProfileService implements IProfileService {
  async getProfile(userId: string): Promise<ServiceResponse<UserProfile>> {
    try {
      loggingService.info(`[PROFILE]: Fetching profile for user: ${userId}`);

      if (isSimulation) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        const localProfile = localStorage.getItem(`applyone_profile_${userId}`);
        if (localProfile) {
          const parsedProfile = JSON.parse(localProfile) as UserProfile;
          if (parsedProfile.email === 'verified@applyone.com') {
            parsedProfile.account_type = 'Professional';
            localStorage.setItem(`applyone_profile_${userId}`, JSON.stringify(parsedProfile));
          }
          return {
            success: true,
            data: parsedProfile,
            error: null,
            message: 'Profile retrieved from local storage.',
          };
        }

        // Return a mock default if not found
        const isVerifiedUser = userId === 'simulated-uuid-1234-5678';
        const mockProfile: UserProfile = {
          id: userId,
          email: isVerifiedUser ? 'verified@applyone.com' : 'user@applyone.com',
          full_name: isVerifiedUser ? 'Candidate User' : 'Alex Johnson',
          phone: '+1 (555) 019-2834',
          account_type: isVerifiedUser ? 'Professional' : 'Student',
          role: 'Student',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        return {
          success: true,
          data: mockProfile,
          error: null,
          message: 'Profile retrieved (mock).',
        };
      }

      // Real Supabase Mode
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // PGRST116 indicates no row found; let's create a default profile row
        if (error.code === 'PGRST116') {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const defaultProfile = {
              id: userId,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || 'Candidate User',
              phone: user.user_metadata?.phone || null,
              account_type: user.user_metadata?.account_type || 'Student',
              role: 'Student',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            const insertResp = await supabase
              .from('profiles')
              .insert(defaultProfile)
              .select()
              .single();
            
            if (!insertResp.error && insertResp.data) {
              return {
                success: true,
                data: insertResp.data as UserProfile,
                error: null,
                message: 'Profile auto-created successfully.',
              };
            }
          }
        }
        throw error;
      }

      return {
        success: true,
        data: data as UserProfile,
        error: null,
        message: 'Profile retrieved successfully.',
      };
    } catch (err: any) {
      loggingService.error(err);
      return {
        success: false,
        data: null,
        error: err.message || 'Failed to retrieve profile.',
        message: 'Error fetching profile.',
      };
    }
  }

  async updateProfile(
    profile: Partial<UserProfile> & { id: string }
  ): Promise<ServiceResponse<UserProfile>> {
    try {
      loggingService.info(`[PROFILE]: Updating profile for user: ${profile.id}`);

      if (isSimulation) {
        await new Promise((resolve) => setTimeout(resolve, 600));

        const localProfileStr = localStorage.getItem(`applyone_profile_${profile.id}`);
        const currentProfile = localProfileStr
          ? (JSON.parse(localProfileStr) as UserProfile)
          : {
              id: profile.id,
              email: 'user@applyone.com',
              full_name: 'Alex Johnson',
              phone: '',
              account_type: 'Student',
              role: 'Student',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

        const updatedProfile: UserProfile = {
          ...currentProfile,
          ...profile,
          updated_at: new Date().toISOString(),
        } as UserProfile;

        localStorage.setItem(`applyone_profile_${profile.id}`, JSON.stringify(updatedProfile));

        return {
          success: true,
          data: updatedProfile,
          error: null,
          message: 'Profile updated successfully.',
        };
      }

      // Real Supabase Mode
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          account_type: profile.account_type,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as UserProfile,
        error: null,
        message: 'Profile updated successfully.',
      };
    } catch (err: any) {
      loggingService.error(err);
      return {
        success: false,
        data: null,
        error: err.message || 'Failed to update profile.',
        message: 'Error updating profile.',
      };
    }
  }
}

export const profileService: IProfileService = new SupabaseProfileService();
