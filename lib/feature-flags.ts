import 'server-only';
import { adminClient } from '@/lib/supabase/admin';

export type FeatureFlag = {
  flag_key: string;
  description: string | null;
  default_enabled: boolean;
  enabled_tiers: string[];
  org_overrides: Record<string, boolean>;
  rollout_pct: number;
  updated_by: string | null;
  updated_at: string;
};

export async function fetchFlags(): Promise<FeatureFlag[]> {
  const supabase = adminClient();
  const { data, error } = await supabase.from('feature_flags').select('*').order('flag_key');
  if (error) return [];
  return (data ?? []) as FeatureFlag[];
}

export async function fetchFlag(key: string): Promise<FeatureFlag | null> {
  const supabase = adminClient();
  const { data, error } = await supabase.from('feature_flags').select('*').eq('flag_key', key).single();
  if (error) return null;
  return (data as FeatureFlag) ?? null;
}
