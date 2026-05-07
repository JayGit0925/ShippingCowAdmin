import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_ROLES = new Set(['super-admin', 'support-admin', 'billing-admin']);

export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await getAdminContext(req);
  } catch (resp) {
    if (resp instanceof Response) return resp;
    throw resp;
  }
  if (ctx.actorRole !== 'super-admin') {
    return NextResponse.json({ error: 'super-admin required' }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as
    | { user_id: string; role: string; is_active?: boolean }
    | null;
  if (!body || !body.user_id || !VALID_ROLES.has(body.role)) {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  const supabase = adminClient();
  const { data: before } = await supabase
    .from('platform_admins')
    .select('*')
    .eq('user_id', body.user_id)
    .maybeSingle();
  const after = {
    user_id: body.user_id,
    role: body.role,
    is_active: body.is_active ?? true,
    created_by: ctx.actorId,
  };
  const { error } = await supabase.from('platform_admins').upsert(after, { onConflict: 'user_id' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit({
    action: 'ADMIN_CREATED',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    resourceType: 'platform_admin',
    resourceId: body.user_id,
    before: before ?? undefined,
    after,
    ip: ctx.ip ?? undefined,
  });
  return NextResponse.json({ ok: true });
}
