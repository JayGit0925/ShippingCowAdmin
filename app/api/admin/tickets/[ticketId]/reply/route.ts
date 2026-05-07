import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_FROM = new Set(['admin', 'note']);

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
  const form = await req.formData().catch(() => new FormData());
  const body = ((form.get('body') as string | null) ?? '').trim();
  const fromType = ((form.get('from_type') as string | null) ?? 'admin').trim();
  if (!body) return NextResponse.json({ error: 'body required' }, { status: 400 });
  if (!ALLOWED_FROM.has(fromType)) {
    return NextResponse.json({ error: 'invalid from_type' }, { status: 400 });
  }

  const supabase = adminClient();
  const { data, error } = await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: params.ticketId,
      from_type: fromType,
      author_id: ctx.actorId,
      body,
    })
    .select('id')
    .single();
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'insert failed' }, { status: 500 });
  }
  await supabase
    .from('support_tickets')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', params.ticketId);
  await logAudit({
    action: 'TICKET_REPLIED',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    resourceType: 'ticket',
    resourceId: params.ticketId,
    after: { from_type: fromType, message_id: data.id },
    ip: ctx.ip ?? undefined,
  });
  return NextResponse.redirect(new URL(`/admin/tickets/${params.ticketId}`, req.url), {
    status: 303,
  });
}
