import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { findReferenceTable } from '@/lib/reference';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = { draftId: string };

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

  const supabase = adminClient();
  const { data, error } = await supabase
    .from('rate_card_drafts')
    .update({ status: 'discarded' })
    .eq('id', body.draftId)
    .eq('table_name', meta.table)
    .eq('status', 'draft')
    .select('id')
    .single();
  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'draft not found or not in draft state' },
      { status: 404 },
    );
  }

  await logAudit({
    action: 'RATE_CARD_DRAFT_DISCARD',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    resourceType: meta.table,
    resourceId: data.id,
    ip: ctx.ip ?? undefined,
  });

  return NextResponse.json({ ok: true });
}
