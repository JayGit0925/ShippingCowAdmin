import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type FlagBody = {
  flag_key: string;
  description?: string;
  default_enabled?: boolean;
  enabled_tiers?: string[];
  org_overrides?: Record<string, boolean>;
  rollout_pct?: number;
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
  let body: FlagBody;
  try {
    body = (await req.json()) as FlagBody;
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }
  if (!body.flag_key || !/^[a-z0-9_]+$/.test(body.flag_key)) {
    return NextResponse.json({ error: 'invalid flag_key (a-z0-9_ only)' }, { status: 400 });
  }
  if (body.rollout_pct != null && (body.rollout_pct < 0 || body.rollout_pct > 100)) {
    return NextResponse.json({ error: 'rollout_pct out of range' }, { status: 400 });
  }
  const supabase = adminClient();
  const { data: before } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('flag_key', body.flag_key)
    .maybeSingle();
  const after = {
    flag_key: body.flag_key,
    description: body.description ?? before?.description ?? null,
    default_enabled: body.default_enabled ?? before?.default_enabled ?? false,
    enabled_tiers: body.enabled_tiers ?? before?.enabled_tiers ?? [],
    org_overrides: body.org_overrides ?? before?.org_overrides ?? {},
    rollout_pct: body.rollout_pct ?? before?.rollout_pct ?? 0,
    updated_by: ctx.actorId,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('feature_flags').upsert(after, { onConflict: 'flag_key' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    action: 'FEATURE_FLAG_CHANGE',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    resourceType: 'feature_flag',
    resourceId: body.flag_key,
    before: before ?? undefined,
    after,
    ip: ctx.ip ?? undefined,
  });
  return NextResponse.json({ ok: true, flag: after });
}
