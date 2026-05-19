import { NextResponse } from 'next/server';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';
import { adminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Suspends an org with a failed payment — sets subscription status to 'suspended'.
// For a hard Stripe cancel, use /api/admin/billing/cancel instead.
export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await getAdminContext(req);
  } catch (resp) {
    if (resp instanceof Response) return resp;
    throw resp;
  }
  if (ctx.actorRole !== 'super-admin' && ctx.actorRole !== 'billing-admin') {
    return NextResponse.json({ error: 'role gate' }, { status: 403 });
  }
  const form = await req.formData().catch(() => new FormData());
  const orgId = (form.get('orgId') as string | null) ?? '';
  if (!orgId) {
    return NextResponse.json({ error: 'orgId required' }, { status: 400 });
  }

  const supabase = adminClient();
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'suspended', updated_at: new Date().toISOString() })
    .eq('org_id', orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  // Also mark org as suspended
  await supabase
    .from('orgs')
    .update({ status: 'suspended', updated_at: new Date().toISOString() })
    .eq('id', orgId);

  await logAudit({
    action: 'SUBSCRIPTION_SUSPENDED',
    actorId: ctx.actorId,
    actorRole: ctx.actorRole,
    orgId,
    resourceType: 'subscription',
    resourceId: orgId,
    after: { status: 'suspended' },
    ip: ctx.ip ?? undefined,
  });
  return NextResponse.redirect(new URL('/admin/revenue', req.url), { status: 303 });
}
