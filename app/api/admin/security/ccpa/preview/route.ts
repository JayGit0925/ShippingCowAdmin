import { NextResponse } from 'next/server';
import { getAdminContext } from '@/lib/admin-context';
import { previewCascade } from '@/lib/ccpa';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
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
  const body = (await req.json().catch(() => null)) as { orgId?: string } | null;
  if (!body?.orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 });
  const preview = await previewCascade(body.orgId);
  return NextResponse.json(preview);
}
