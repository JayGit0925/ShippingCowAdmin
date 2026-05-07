import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  req: Request,
  { params }: { params: { ticketId: string } },
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

  const form = await req.formData().catch(() => new FormData());
  const raw = ((form.get('assignee_user_id') as string | null) ?? '').trim();
  let assignee: string | null;
  if (raw === '') {
    assignee = null;
  } else if (UUID_RE.test(raw)) {
    assignee = raw;
  } else {
    return NextResponse.json({ error: 'invalid assignee_user_id' }, { status: 400 });
  }

  const supabase = adminClient();
  const { data: before } = await supabase
    .from('support_tickets')
    .select('assignee_user_id')
    .eq('id', params.ticketId)
    .single();
  const beforeAssignee = (before?.assignee_user_id as string | null | undefined) ?? null;

  const { error } = await supabase
    .from('support_tickets')
    .update({ assignee_user_id: assignee, updated_at: new Date().toISOString() })
    .eq('id', params.ticketId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit({
    action: 'TICKET_ASSIGNED',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    resourceType: 'ticket',
    resourceId: params.ticketId,
    before: { assignee_user_id: beforeAssignee },
    after: { assignee_user_id: assignee },
    ip: ctx.ip ?? undefined,
  });

  return NextResponse.redirect(new URL(`/admin/tickets/${params.ticketId}`, req.url), {
    status: 303,
  });
}
