import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type KillSwitchBody = {
  enabled?: boolean;
  reason?: string;
};

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
  const body = (await req.json().catch(() => null)) as KillSwitchBody | null;
  if (!body) {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }
  if (typeof body.enabled !== 'boolean') {
    return NextResponse.json({ error: 'enabled (boolean) required' }, { status: 400 });
  }
  if (!body.reason || typeof body.reason !== 'string' || body.reason.trim().length === 0) {
    return NextResponse.json({ error: 'reason required' }, { status: 400 });
  }
  const supabase = adminClient();
  const { data: before } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('flag_key', 'mooovy_enabled')
    .single();
  const { error } = await supabase
    .from('feature_flags')
    .update({ default_enabled: body.enabled, updated_by: ctx.actorId, updated_at: new Date().toISOString() })
    .eq('flag_key', 'mooovy_enabled');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    action: 'AI_KILL_SWITCH_TOGGLE',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    resourceType: 'feature_flag',
    resourceId: 'mooovy_enabled',
    before: before ?? undefined,
    after: { default_enabled: body.enabled },
    reason: body.reason,
    ip: ctx.ip ?? undefined,
  });
  return NextResponse.json({ ok: true, enabled: body.enabled });
}
