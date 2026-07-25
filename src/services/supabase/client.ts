import { createClient } from '@supabase/supabase-js';
import { loggingService } from '../logging/loggingService';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  loggingService.warn(
    'Supabase environment variables are missing. Direct authentication features will fall back to simulation mode.'
  );
}

// Fallbacks are provided to allow the client to compile/load even without .env variables
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-key'
);
