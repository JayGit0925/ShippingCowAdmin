import { NextResponse } from 'next/server';
import { getAdminContext } from '@/lib/admin-context';
import { logAudit } from '@/lib/audit';
import { stripeClient, StripeNotConfiguredError } from '@/lib/stripe';

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
  if (ctx.actorRole !== 'super-admin' && ctx.actorRole !== 'billing-admin') {
    return NextResponse.json({ error: 'role gate' }, { status: 403 });
  }
  const form = await req.formData().catch(() => new FormData());
  const stripeCustomerId = (form.get('stripeCustomerId') as string | null) ?? '';
  const couponId = (form.get('couponId') as string | null) ?? '';
  if (!stripeCustomerId) {
    return NextResponse.json({ error: 'stripeCustomerId required' }, { status: 400 });
  }
  if (!couponId) {
    return NextResponse.json({ error: 'couponId required' }, { status: 400 });
  }

  try {
    const stripe = stripeClient();
    const result = await stripe.customers.update(stripeCustomerId, { coupon: couponId });
    await logAudit({
      action: 'COUPON_APPLIED',
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      resourceType: 'stripe_customer',
      resourceId: result.id,
      after: { customer_id: stripeCustomerId, coupon: couponId },
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
