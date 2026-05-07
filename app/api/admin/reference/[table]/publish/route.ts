import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { findReferenceTable } from '@/lib/reference';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';
import { validateDraft } from '@/lib/reference-validators';
import { applyDraftAsPublished } from '@/lib/reference-publish';

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
  const { data: draft, error: dErr } = await supabase
    .from('rate_card_drafts')
    .select('id, draft_payload, status, table_name')
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

  const validation = validateDraft(meta.table, draft.draft_payload);
  if (!validation.ok) {
    return NextResponse.json(
      { error: 'validation failed', validation },
      { status: 422 },
    );
  }

  const rows = draft.draft_payload as Record<string, unknown>[];
  let outcome;
  try {
    outcome = await applyDraftAsPublished(meta.table, rows);
  } catch (ex) {
    return NextResponse.json(
      { error: ex instanceof Error ? ex.message : 'publish failed' },
      { status: 500 },
    );
  }

  await supabase
    .from('rate_card_drafts')
    .update({ status: 'published' })
    .eq('id', draft.id);

  await logAudit({
    action: 'RATE_CARD_PUBLISH',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    resourceType: meta.table,
    resourceId: draft.id,
    after: outcome as unknown as Record<string, unknown>,
    ip: ctx.ip ?? undefined,
  });

  return NextResponse.json({ ok: true, outcome });
}
