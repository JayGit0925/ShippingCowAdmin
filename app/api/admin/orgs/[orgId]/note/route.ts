import { NextResponse } from 'next/server';
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
  const note = ((form.get('note') as string | null) ?? '').trim();
  if (!note) {
    return NextResponse.json({ error: 'note required' }, { status: 400 });
  }

  const supabase = adminClient();
  const insertRes = await supabase
    .from('admin_notes')
    .insert({
      org_id: params.orgId,
      note,
      created_by: ctx.actorId,
    })
    .select('id')
    .single();
  if (insertRes.error || !insertRes.data) {
    return NextResponse.json(
      { error: insertRes.error?.message ?? 'insert failed' },
      { status: 500 },
    );
  }
  const inserted = insertRes.data as { id: string };

  await logAudit({
    action: 'ADMIN_NOTE_CREATED',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    orgId: params.orgId,
    resourceType: 'admin_note',
    resourceId: inserted.id,
    after: { note_id: inserted.id, length: note.length },
    ip: ctx.ip ?? undefined,
  });

  return redirectBack(req, params.orgId);
}

async function safeReadForm(req: Request): Promise<FormData> {
  try {
    return await req.formData();
  } catch {
    return new FormData();
  }
}

function redirectBack(req: Request, orgId: string): Response {
  const accept = req.headers.get('accept') ?? '';
  if (accept.includes('application/json')) {
    return NextResponse.json({ ok: true });
  }
  const back = new URL(`/admin/customers/${orgId}`, req.url);
  return NextResponse.redirect(back, { status: 303 });
}
