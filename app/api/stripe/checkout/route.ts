import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { priceId, plan } = body as { priceId?: string; plan?: 'pro' | 'business' };
    const proPriceId = process.env.STRIPE_PRO_PRICE_ID;
    const businessPriceId = process.env.STRIPE_BUSINESS_PRICE_ID;

    const stripe = getStripe();
    const resolvedPriceId = priceId ?? (plan === 'pro' ? proPriceId : plan === 'business' ? businessPriceId : null);
    if (!resolvedPriceId || (resolvedPriceId !== proPriceId && resolvedPriceId !== businessPriceId)) {
      return NextResponse.json(
        { error: 'Invalid or missing priceId or plan. Use priceId or plan: "pro" | "business".' },
        { status: 400 }
      );
    }

    const { data: user } = await supabaseServer.from('users').select('stripe_customer_id, email').eq('id', userId).single();

    let customerId = user?.stripe_customer_id as string | null | undefined;
    if (!customerId && stripe.customers) {
      const customer = await stripe.customers.create({
        email: user?.email ?? undefined,
        metadata: { clerk_user_id: userId },
      });
      customerId = customer.id;
      await supabaseServer.from('users').update({ stripe_customer_id: customerId }).eq('id', userId);
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const session = await stripe.checkout.sessions.create({
      customer: customerId ?? undefined,
      mode: 'subscription',
      line_items: [{ price: resolvedPriceId, quantity: 1 }],
      success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard`,
      metadata: { clerk_user_id: userId },
      subscription_data: { metadata: { clerk_user_id: userId } },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json(
      { error: 'Checkout failed' },
      { status: 500 }
    );
  }
}
