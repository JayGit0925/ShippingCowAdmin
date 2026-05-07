import { NextResponse } from 'next/server';
import { SUPABASE_CONFIGURED, DEV_BYPASS } from '@/lib/env';

export async function GET() {
  return NextResponse.json({
    ok: true,
    supabaseConfigured: SUPABASE_CONFIGURED,
    devBypass: DEV_BYPASS,
    timestamp: new Date().toISOString(),
  });
}
