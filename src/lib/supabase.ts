import { createClient } from '@supabase/supabase-js';

// Using the credentials provided by the user
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://uvuarshuegqppgvlmkgd.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2dWFyc2h1ZWdxcHBndmxta2dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTMxMjUsImV4cCI6MjA4NTk2OTEyNX0.X5RgAEnJEex7hLolZFyI_rvfwBaXBwXL0Rz5H7uj1eM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const updateProfile = async (userId: string, updates: any) => {
  const { error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  return { error };
};
