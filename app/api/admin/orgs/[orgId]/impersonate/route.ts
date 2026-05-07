import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { adminClient } from '@/lib/supabase/admin';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
  if (ctx.actorRole !== 'super-admin' && ctx.actorRole !== 'support-admin') {
    return NextResponse.json({ error: 'role gate' }, { status: 403 });
  }

  const form = await safeReadForm(req);
  const reason = ((form.get('reason') as string | null) ?? '').trim();
  if (!reason) {
    return NextResponse.json({ error: 'reason required' }, { status: 400 });
  }
  const ticketId = (form.get('ticket_id') as string | null) || null;

  const supabase = adminClient();
  const memberRes = await supabase
    .from('org_members')
    .select('user_id')
    .eq('org_id', params.orgId)
    .limit(1)
    .single();
  if (memberRes.error || !memberRes.data) {
    return NextResponse.json({ error: 'no member to impersonate' }, { status: 404 });
  }
  const member = memberRes.data as { user_id: string };

  const id = randomUUID();
  const tokenHash = randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const insertRes = await supabase.from('impersonation_sessions').insert({
    id,
    admin_user_id: ctx.actorId,
    target_user_id: member.user_id,
    org_id: params.orgId,
    reason,
    ticket_id: ticketId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });
  if (insertRes.error) {
    return NextResponse.json({ error: insertRes.error.message }, { status: 500 });
  }

  await logAudit({
    action: 'IMPERSONATE_USER',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    orgId: params.orgId,
    resourceType: 'user',
    resourceId: member.user_id,
    after: { session_id: id, target_user_id: member.user_id, expires_at: expiresAt },
    reason,
    ticketId: ticketId ?? undefined,
    ip: ctx.ip ?? undefined,
  });

  const portal = process.env.USER_PORTAL_URL ?? '';
  if (!portal) {
    return NextResponse.json(
      {
        ok: true,
        session_id: id,
        note: 'USER_PORTAL_URL not configured; share session_id with operator',
      },
      { status: 200 },
    );
  }

  const target = new URL(`${portal.replace(/\/$/, '')}/impersonate?session=${id}`);
  return NextResponse.redirect(target, { status: 303 });
}

async function safeReadForm(req: Request): Promise<FormData> {
  try {
    return await req.formData();
  } catch {
    return new FormData();
  }
}
