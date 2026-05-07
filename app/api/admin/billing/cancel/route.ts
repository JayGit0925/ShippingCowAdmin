import { NextResponse } from 'next/server';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';
import { stripeClient, StripeNotConfiguredError } from '@/lib/stripe';
import { adminClient } from '@/lib/supabase/admin';

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
    return NextResponse.json({ error: 'role gate' }, { status: 403 });
  }
  const form = await req.formData().catch(() => new FormData());
  const orgId = (form.get('orgId') as string | null) ?? '';
  if (!orgId) {
    return NextResponse.json({ error: 'orgId required' }, { status: 400 });
  }

  const supabase = adminClient();
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('org_id', orgId)
    .single();
  if (!sub?.stripe_subscription_id) {
    return NextResponse.json({ error: 'no stripe_subscription_id for org' }, { status: 404 });
  }
  const stripeSubscriptionId = sub.stripe_subscription_id as string;

  try {
    const stripe = stripeClient();
    const result = await stripe.subscriptions.cancel(stripeSubscriptionId);
    await logAudit({
      action: 'SUBSCRIPTION_CANCELLED',
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      orgId,
      resourceType: 'stripe_subscription',
      resourceId: result.id,
      after: {
        stripe_subscription_id: stripeSubscriptionId,
        status: result.status,
        canceled_at: result.canceled_at,
      },
      ip: ctx.ip ?? undefined,
    });
    return NextResponse.redirect(new URL('/admin/revenue', req.url), { status: 303 });
  } catch (ex) {
    if (ex instanceof StripeNotConfiguredError) {
      return NextResponse.json({ error: ex.message }, { status: 503 });
    }
    return NextResponse.json(
      { error: ex instanceof Error ? ex.message : 'stripe failure' },
      { status: 502 },
    );
  }
}
