import { NextResponse } from 'next/server';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';
import { executeCascade } from '@/lib/ccpa';
import { adminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    | { orgId?: string; orgNameTyped?: string; reason?: string; ticketId?: string }
    | null;
  if (!body?.orgId || !body.orgNameTyped) {
    return NextResponse.json(
      { error: 'orgId and orgNameTyped required' },
      { status: 400 },
    );
  }
  const supabase = adminClient();
  const { data: org } = await supabase
    .from('orgs')
    .select('name')
    .eq('id', body.orgId)
    .single();
  if (!org || (org as { name: string }).name !== body.orgNameTyped) {
    return NextResponse.json({ error: 'org name confirm mismatch' }, { status: 400 });
  }

  const outcome = await executeCascade(body.orgId);

  await logAudit({
    action: 'CCPA_ERASURE',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    orgId: body.orgId,
    resourceType: 'org',
    resourceId: body.orgId,
    after: outcome as unknown as Record<string, unknown>,
    reason: body.reason ?? undefined,
    ticketId: body.ticketId ?? undefined,
    ip: ctx.ip ?? undefined,
  });
  return NextResponse.json({ ok: true, outcome });
}
