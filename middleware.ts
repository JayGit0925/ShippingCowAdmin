import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { SUPABASE_CONFIGURED } from '@/lib/env';

// DEV_BYPASS=1 or DEV_BYPASS=true in .env.local forces middleware to skip auth.
// Also activates automatically when Supabase keys are absent (SUPABASE_CONFIGURED=false).
const FORCE_DEV_BYPASS =
  !SUPABASE_CONFIGURED ||
  process.env.DEV_BYPASS === '1' ||
  process.env.DEV_BYPASS === 'true';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  if (FORCE_DEV_BYPASS) {
    res.headers.set('x-admin-role', 'super-admin');
    res.headers.set('x-dev-bypass', '1');
    return res;
  }

  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.redirect(new URL('/login', req.url));

  const { data: admin } = await supabase
    .from('platform_admins')
    .select('role, is_active')
    .eq('user_id', session.user.id)
    .single();

  if (!admin || !admin.is_active) {
    return NextResponse.redirect(new URL('/403', req.url));
  }

  res.headers.set('x-admin-role', admin.role);
  return res;
}

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };
