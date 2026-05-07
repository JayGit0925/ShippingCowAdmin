import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_TIERS = new Set(['calf', 'cow', 'bull']);

export async function POST(
  req: Request,
  { params }: { params: { orgId: string } },
) {
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

  const form = await req.formData().catch(() => new FormData());
  const tier = (form.get('tier') as string | null) ?? '';
  const reason = (form.get('reason') as string | null) ?? '';
  if (!VALID_TIERS.has(tier)) {
    return NextResponse.json({ error: 'invalid tier' }, { status: 400 });
  }

  const supabase = adminClient();
  const { data: before } = await supabase
    .from('subscriptions')
    .select('tier_override')
    .eq('org_id', params.orgId)
    .single();
  const after = { tier, set_by: ctx.actorId, set_at: new Date().toISOString() };
  const { error } = await supabase
    .from('subscriptions')
    .update({ tier_override: after })
    .eq('org_id', params.orgId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit({
    action: 'TIER_OVERRIDE',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    orgId: params.orgId,
    resourceType: 'subscription',
    resourceId: params.orgId,
    before: { tier_override: before?.tier_override ?? null },
    after: { tier_override: after },
    reason: reason || undefined,
    ip: ctx.ip ?? undefined,
  });

  return NextResponse.redirect(new URL(`/admin/customers/${params.orgId}`, req.url), {
    status: 303,
  });
}
