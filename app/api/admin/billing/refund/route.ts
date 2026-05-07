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
  const paymentIntentId = (form.get('paymentIntentId') as string | null) ?? '';
  const amount = (form.get('amount') as string | null) ?? '';
  if (!paymentIntentId) {
    return NextResponse.json({ error: 'paymentIntentId required' }, { status: 400 });
  }

  try {
    const stripe = stripeClient();
    const result = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      ...(amount ? { amount: parseInt(amount, 10) } : {}),
    });
    await logAudit({
      action: 'REFUND_INITIATED',
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      resourceType: 'stripe_refund',
      resourceId: result.id,
      after: { refund_id: result.id, status: result.status, amount: result.amount },
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
