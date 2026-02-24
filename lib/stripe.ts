import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      _stripe = new Stripe('sk_placeholder', { apiVersion: '2025-02-24.acacia' });
      return _stripe;
    }
    throw new Error('Missing STRIPE_SECRET_KEY');
  }
  _stripe = new Stripe(key, { apiVersion: '2025-02-24.acacia' });
  return _stripe;
}
