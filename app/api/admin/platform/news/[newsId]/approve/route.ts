import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { newsId: string } }) {
  let ctx;
  try {
    ctx = await getAdminContext(req);
  } catch (resp) {
    if (resp instanceof Response) return resp;
    throw resp;
  }
  if (ctx.actorRole !== 'super-admin' && ctx.actorRole !== 'support-admin') {
    return NextResponse.json({ error: 'super-admin or support-admin required' }, { status: 403 });
  }
  const supabase = adminClient();
  const { data: before } = await supabase
    .from('news_items')
    .select('*')
    .eq('id', params.newsId)
    .maybeSingle();
  const { error } = await supabase
    .from('news_items')
    .update({ approval_state: 'approved', approved_by: ctx.actorId })
    .eq('id', params.newsId);
  if (error) {
    if (error.code === '42P01' || /does not exist/i.test(error.message)) {
      return NextResponse.json(
        { error: 'news_items table not present in this Supabase project' },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await logAudit({
    action: 'NEWS_CARD_PUBLISH',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    resourceType: 'news_item',
    resourceId: params.newsId,
    before: before ?? undefined,
    after: { approval_state: 'approved', approved_by: ctx.actorId },
    ip: ctx.ip ?? undefined,
  });
  return NextResponse.json({ ok: true });
}
