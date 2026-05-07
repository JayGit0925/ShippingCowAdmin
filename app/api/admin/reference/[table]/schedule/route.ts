import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { findReferenceTable } from '@/lib/reference';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = { draftId: string; effectiveFrom: string };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(
  req: Request,
  { params }: { params: { table: string } },
) {
  const meta = findReferenceTable(params.table);
  if (!meta) return NextResponse.json({ error: 'unknown table' }, { status: 404 });

  let ctx;
  try {
    ctx = await getAdminContext(req);
  } catch (resp) {
    if (resp instanceof Response) return resp;
    throw resp;
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }
  if (!body.draftId) {
    return NextResponse.json({ error: 'draftId required' }, { status: 400 });
  }
  if (!ISO_DATE.test(body.effectiveFrom)) {
    return NextResponse.json(
      { error: 'effectiveFrom must be YYYY-MM-DD' },
      { status: 400 },
    );
  }

  const supabase = adminClient();
  const { data: draft, error: dErr } = await supabase
    .from('rate_card_drafts')
    .select('id, status, table_name')
    .eq('id', body.draftId)
    .single();
  if (dErr || !draft) {
    return NextResponse.json({ error: 'draft not found' }, { status: 404 });
  }
  if (draft.table_name !== meta.table) {
    return NextResponse.json({ error: 'draft/table mismatch' }, { status: 400 });
  }
  if (draft.status !== 'draft') {
    return NextResponse.json({ error: `draft status is ${draft.status}` }, { status: 409 });
  }

  const { data: scheduled, error } = await supabase
    .from('scheduled_publishes')
    .insert({
      table_name: meta.table,
      draft_id: draft.id,
      effective_from: body.effectiveFrom,
      scheduled_by: ctx.actorId,
      status: 'pending',
    })
    .select('id, effective_from')
    .single();
  if (error || !scheduled) {
    return NextResponse.json(
      { error: error?.message ?? 'schedule failed' },
      { status: 500 },
    );
  }

  await logAudit({
    action: 'RATE_CARD_SCHEDULE',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    resourceType: meta.table,
    resourceId: draft.id,
    after: { effective_from: scheduled.effective_from, schedule_id: scheduled.id },
    ip: ctx.ip ?? undefined,
  });

  return NextResponse.json({ ok: true, scheduleId: scheduled.id });
}
