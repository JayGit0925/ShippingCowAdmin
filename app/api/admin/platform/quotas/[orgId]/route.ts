import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type QuotaBody = {
  quota_override?: Record<string, unknown>;
  ai_suspended?: boolean;
  reason?: string;
};

export async function POST(req: Request, { params }: { params: { orgId: string } }) {
  let ctx;
  try {
    ctx = await getAdminContext(req);
  } catch (resp) {
    if (resp instanceof Response) return resp;
    throw resp;
  }
  if (ctx.actorRole !== 'super-admin' && ctx.actorRole !== 'billing-admin') {
    return NextResponse.json(
      { error: 'super-admin or billing-admin required' },
      { status: 403 },
    );
  }
  const body = (await req.json().catch(() => null)) as QuotaBody | null;
  if (!body) {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }
  if (body.quota_override === undefined && body.ai_suspended === undefined) {
    return NextResponse.json(
      { error: 'quota_override or ai_suspended required' },
      { status: 400 },
    );
  }

  const supabase = adminClient();
  const { data: before } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('org_id', params.orgId)
    .maybeSingle();

  const updatePayload: Record<string, unknown> = {};
  if (body.quota_override !== undefined) updatePayload.quota_override = body.quota_override;
  if (body.ai_suspended !== undefined) updatePayload.ai_suspended = body.ai_suspended;

  const { error } = await supabase
    .from('subscriptions')
    .update(updatePayload)
    .eq('org_id', params.orgId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const beforeAiSuspended =
    (before as { ai_suspended?: boolean } | null)?.ai_suspended ?? null;

  if (
    body.ai_suspended !== undefined &&
    body.ai_suspended !== beforeAiSuspended
  ) {
    await logAudit({
      action: 'AI_SUSPEND_ORG',
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      orgId: params.orgId,
      resourceType: 'subscription',
      resourceId: params.orgId,
      before: before ?? undefined,
      after: { ai_suspended: body.ai_suspended },
      reason: body.reason ?? undefined,
      ip: ctx.ip ?? undefined,
    });
  }

  await logAudit({
    action: 'QUOTA_OVERRIDE',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    orgId: params.orgId,
    resourceType: 'subscription',
    resourceId: params.orgId,
    before: before ?? undefined,
    after: updatePayload,
    reason: body.reason ?? undefined,
    ip: ctx.ip ?? undefined,
  });

  return NextResponse.json({ ok: true });
}
