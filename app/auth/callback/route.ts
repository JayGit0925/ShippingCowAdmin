import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin));
  }

  try {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
  } catch (error) {
    console.error('Session exchange failed:', error);
    return NextResponse.redirect(new URL('/login?error=session_exchange_failed', requestUrl.origin));
  }

  return NextResponse.redirect(new URL('/admin', requestUrl.origin));
}
