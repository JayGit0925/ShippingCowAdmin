import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { SUPABASE_CONFIGURED } from '@/lib/env';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  if (!SUPABASE_CONFIGURED) {
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

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const hasTotp = (factors?.totp ?? []).length > 0;
  if (!hasTotp && !req.nextUrl.pathname.startsWith('/admin/setup-mfa')) {
    return NextResponse.redirect(new URL('/admin/setup-mfa', req.url));
  }

  res.headers.set('x-admin-role', admin.role);
  return res;
}

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };
