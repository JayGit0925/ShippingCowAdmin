import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_ROLES = new Set(['parser', 'insight', 'chat']);

type ModelPinBody = {
  org_id?: string | null;
  role?: string;
  model_string?: string;
  expiry?: string | null;
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
  const body = (await req.json().catch(() => null)) as ModelPinBody | null;
  if (!body) {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }
  if (!body.role || !VALID_ROLES.has(body.role)) {
    return NextResponse.json({ error: 'invalid role (parser|insight|chat)' }, { status: 400 });
  }
  if (!body.model_string || typeof body.model_string !== 'string' || body.model_string.trim().length === 0) {
    return NextResponse.json({ error: 'model_string required' }, { status: 400 });
  }
  const supabase = adminClient();
  const orgId = body.org_id ?? null;
  const beforeQuery = supabase.from('model_pins').select('*').eq('role', body.role);
  const { data: before } =
    orgId === null
      ? await beforeQuery.is('org_id', null).maybeSingle()
      : await beforeQuery.eq('org_id', orgId).maybeSingle();
  const after = {
    org_id: orgId,
    role: body.role,
    model_string: body.model_string,
    pinned_by: ctx.actorId,
    pinned_at: new Date().toISOString(),
    expiry: body.expiry ?? null,
  };
  const { data: upserted, error } = await supabase
    .from('model_pins')
    .upsert(after, { onConflict: 'org_id,role' })
    .select('*')
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const resourceId =
    (upserted as { id?: string } | null)?.id ?? `${orgId ?? 'global'}:${body.role}`;

  await logAudit({
    action: 'MODEL_PIN_SET',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    resourceType: 'model_pin',
    resourceId,
    before: before ?? undefined,
    after,
    ip: ctx.ip ?? undefined,
  });
  return NextResponse.json({ ok: true, pin: upserted ?? after });
}
