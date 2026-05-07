import 'server-only';
import Stripe from 'stripe';
import { ENV, STRIPE_CONFIGURED } from '@/lib/env';

export class StripeNotConfiguredError extends Error {
  constructor() {
    super('STRIPE_SECRET_KEY not set; billing actions are disabled.');
    this.name = 'StripeNotConfiguredError';
  }
}

let _stripe: Stripe | null = null;

export function stripeClient(): Stripe {
  if (!STRIPE_CONFIGURED) throw new StripeNotConfiguredError();
  if (_stripe) return _stripe;
  _stripe = new Stripe(ENV.STRIPE_SECRET_KEY);
  return _stripe;
}
