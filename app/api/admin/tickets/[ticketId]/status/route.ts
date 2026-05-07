import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_STATUS = new Set(['open', 'in_progress', 'resolved']);

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
  const status = ((form.get('status') as string | null) ?? '').trim();
  if (!ALLOWED_STATUS.has(status)) {
    return NextResponse.json({ error: 'invalid status' }, { status: 400 });
  }

  const supabase = adminClient();
  const { data: before } = await supabase
    .from('support_tickets')
    .select('status')
    .eq('id', params.ticketId)
    .single();
  const beforeStatus = (before?.status as string | undefined) ?? null;

  const { error } = await supabase
    .from('support_tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', params.ticketId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit({
    action: 'TICKET_STATUS_CHANGED',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    resourceType: 'ticket',
    resourceId: params.ticketId,
    before: { status: beforeStatus },
    after: { status },
    ip: ctx.ip ?? undefined,
  });

  return NextResponse.redirect(new URL(`/admin/tickets/${params.ticketId}`, req.url), {
    status: 303,
  });
}
