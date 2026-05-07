const has = (k: string) => typeof process.env[k] === 'string' && process.env[k]!.length > 0;

export const ENV = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  USER_PORTAL_URL: process.env.USER_PORTAL_URL ?? '',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001',
};

export const SUPABASE_CONFIGURED =
  has('NEXT_PUBLIC_SUPABASE_URL') &&
  has('NEXT_PUBLIC_SUPABASE_ANON_KEY') &&
  has('SUPABASE_SERVICE_ROLE_KEY');

export const DEV_BYPASS = !SUPABASE_CONFIGURED && process.env.NODE_ENV !== 'production';
