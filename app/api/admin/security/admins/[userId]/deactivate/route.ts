import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { userId: string } }) {
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
  const supabase = adminClient();
  const { data: before } = await supabase
    .from('platform_admins')
    .select('*')
    .eq('user_id', params.userId)
    .maybeSingle();
  if (!before) {
    return NextResponse.json({ error: 'admin not found' }, { status: 404 });
  }
  const after = { is_active: false };
  const { error } = await supabase
    .from('platform_admins')
    .update(after)
    .eq('user_id', params.userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit({
    action: 'ADMIN_DELETED',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    resourceType: 'platform_admin',
    resourceId: params.userId,
    before: before ?? undefined,
    after,
    ip: ctx.ip ?? undefined,
  });
  return NextResponse.json({ ok: true });
}
