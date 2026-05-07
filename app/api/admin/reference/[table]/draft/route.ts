import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { findReferenceTable } from '@/lib/reference';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';
import { validateDraft } from '@/lib/reference-validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = {
  draftId?: string;
  payload: unknown;
};

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
  if (body.payload == null) {
    return NextResponse.json({ error: 'payload required' }, { status: 400 });
  }

  const validation = validateDraft(meta.table, body.payload);

  const supabase = adminClient();
  const isUpdate = !!body.draftId;

  if (isUpdate) {
    const { data, error } = await supabase
      .from('rate_card_drafts')
      .update({
        draft_payload: body.payload,
        validation_result: validation,
      })
      .eq('id', body.draftId!)
      .eq('table_name', meta.table)
      .eq('status', 'draft')
      .select('id')
      .single();
    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? 'draft not found' },
        { status: 404 },
      );
    }
    await logAudit({
      action: 'RATE_CARD_DRAFT_UPDATE',
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      resourceType: meta.table,
      resourceId: data.id,
      after: { rowCount: validation.rowCount, valid: validation.ok },
      ip: ctx.ip ?? undefined,
    });
    return NextResponse.json({ draftId: data.id, validation });
  }

  const { data, error } = await supabase
    .from('rate_card_drafts')
    .insert({
      table_name: meta.table,
      draft_payload: body.payload,
      validation_result: validation,
      status: 'draft',
      created_by: ctx.actorId,
    })
    .select('id')
    .single();
  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'insert failed' },
      { status: 500 },
    );
  }
  await logAudit({
    action: 'RATE_CARD_DRAFT_CREATE',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    resourceType: meta.table,
    resourceId: data.id,
    after: { rowCount: validation.rowCount, valid: validation.ok },
    ip: ctx.ip ?? undefined,
  });
  return NextResponse.json({ draftId: data.id, validation });
}
