import type { User as SupabaseUser } from '@supabase/supabase-js';

export type AuthStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface AuthState {
  user: SupabaseUser | null;
  status: AuthStatus;
  error: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  age: number | null;
  city: string | null;
  bio: string | null;
  goals: string[];
  availability: string | null;
  commitment_level: string | null;
  profile_complete: boolean;
}
