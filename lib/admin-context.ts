import 'server-only';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { adminClient } from '@/lib/supabase/admin';
import { SUPABASE_CONFIGURED } from '@/lib/env';
import type { AdminRole } from '@/lib/audit';

export type AdminContext = {
  actorId: string;
  actorRole: AdminRole;
  ip: string | null;
};

const DEV_BYPASS_CONTEXT: AdminContext = {
  actorId: '00000000-0000-0000-0000-000000000000',
  actorRole: 'super-admin',
  ip: null,
};

function readIp(req: Request): string | null {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim() || null;
  return req.headers.get('x-real-ip');
}

export async function getAdminContext(req: Request): Promise<AdminContext> {
  if (!SUPABASE_CONFIGURED) {
    return { ...DEV_BYPASS_CONTEXT, ip: readIp(req) };
  }

  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new Response('Unauthorized', { status: 401 }) as unknown as Error;
  }

  const headerRole = req.headers.get('x-admin-role') as AdminRole | null;
  if (headerRole) {
    return { actorId: session.user.id, actorRole: headerRole, ip: readIp(req) };
  }

  const { data: row } = await adminClient()
    .from('platform_admins')
    .select('role, is_active')
    .eq('user_id', session.user.id)
    .single();

  if (!row || !row.is_active) {
    throw new Response('Forbidden', { status: 403 }) as unknown as Error;
  }

  return {
    actorId: session.user.id,
    actorRole: row.role as AdminRole,
    ip: readIp(req),
  };
}
