import { createClient } from '@supabase/supabase-js';

// Using the credentials provided by the user
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://uvuarshuegqppgvlmkgd.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_plrAYL_dS4fbW4P-jHlpaA_0Ind395i';

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
