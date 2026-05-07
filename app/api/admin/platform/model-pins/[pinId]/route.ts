import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(req: Request, { params }: { params: { pinId: string } }) {
  let ctx;
  try {
    ctx = await getAdminContext(req);
  } catch (resp) {
    if (resp instanceof Response) return resp;
    throw resp;
  }
  if (ctx.actorRole !== 'super-admin') {
    return NextResponse.json({ error: 'super-admin required' }, { status: 403 });
  }
  const supabase = adminClient();
  const { data: before } = await supabase
    .from('model_pins')
    .select('*')
    .eq('id', params.pinId)
    .maybeSingle();
  const { error } = await supabase.from('model_pins').delete().eq('id', params.pinId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit({
    action: 'MODEL_PIN_REMOVED',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    resourceType: 'model_pin',
    resourceId: params.pinId,
    before: before ?? undefined,
    after: { deleted: true },
    ip: ctx.ip ?? undefined,
  });
  return NextResponse.json({ ok: true });
}
