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
  const reason = (form.get('reason') as string | null) ?? '';

  const supabase = adminClient();
  const membersRes = await supabase
    .from('org_members')
    .select('user_id')
    .eq('org_id', params.orgId);
  if (membersRes.error) {
    return NextResponse.json({ error: membersRes.error.message }, { status: 500 });
  }
  const members = (membersRes.data ?? []) as Array<{ user_id: string }>;

  let signedOut = 0;
  for (const member of members) {
    try {
      await supabase.auth.admin.signOut(member.user_id);
      signedOut += 1;
    } catch {
      // best-effort; continue with remaining members
    }
  }

  await logAudit({
    action: 'FORCE_LOGOUT_USER',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    orgId: params.orgId,
    resourceType: 'org',
    resourceId: params.orgId,
    after: { signed_out: signedOut, attempted: members.length },
    reason: reason || undefined,
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
