import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_PRIORITY = new Set(['urgent', 'high', 'normal', 'low']);

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
  const priority = ((form.get('priority') as string | null) ?? '').trim();
  if (!ALLOWED_PRIORITY.has(priority)) {
    return NextResponse.json({ error: 'invalid priority' }, { status: 400 });
  }

  const supabase = adminClient();
  const { data: before } = await supabase
    .from('support_tickets')
    .select('priority')
    .eq('id', params.ticketId)
    .single();
  const beforePriority = (before?.priority as string | undefined) ?? null;

  const { error } = await supabase
    .from('support_tickets')
    .update({ priority, updated_at: new Date().toISOString() })
    .eq('id', params.ticketId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit({
    action: 'TICKET_PRIORITY_CHANGED',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    resourceType: 'ticket',
    resourceId: params.ticketId,
    before: { priority: beforePriority },
    after: { priority },
    ip: ctx.ip ?? undefined,
  });

  return NextResponse.redirect(new URL(`/admin/tickets/${params.ticketId}`, req.url), {
    status: 303,
  });
}
