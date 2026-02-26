import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseServer } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { getStripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const rawBody = await req.text();
    const sig = req.headers.get('stripe-signature');
    if (!sig || !webhookSecret) {
      return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    const stripe = getStripe();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid signature';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkUserId = session.metadata?.clerk_user_id;
        const subscriptionId = session.subscription as string | null;
        if (!clerkUserId) break;

        let plan: 'pro' | 'business' = 'pro';
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = sub.items.data[0]?.price.id;
          if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID) plan = 'business';
        }

        await supabaseServer
          .from('users')
          .update({ plan })
          .eq('id', clerkUserId);

        const { data: user } = await supabaseServer.from('users').select('email').eq('id', clerkUserId).single();
        if (user?.email) {
          await sendEmail(user.email, 'upgrade_success', { plan });
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const clerkUserId = subscription.metadata?.clerk_user_id;
        if (!clerkUserId) break;
        const status = subscription.status;
        if (status === 'active' || status === 'trialing') {
          const priceId = subscription.items.data[0]?.price.id;
          const plan: 'pro' | 'business' =
            priceId === process.env.STRIPE_BUSINESS_PRICE_ID ? 'business' : 'pro';
          await supabaseServer
            .from('users')
            .update({ plan })
            .eq('id', clerkUserId);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const clerkUserId = subscription.metadata?.clerk_user_id;
        if (!clerkUserId) break;

        await supabaseServer
          .from('users')
          .update({ plan: 'free' })
          .eq('id', clerkUserId);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        if (!customerId) break;
        const { data: user } = await supabaseServer
          .from('users')
          .select('email')
          .eq('stripe_customer_id', customerId)
          .single();
        if (user?.email) {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
          await sendEmail(user.email, 'payment_failed', {
            billingUrl: `${baseUrl}/dashboard/billing`,
          });
        }
        break;
      }
      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;
        const clerkUserId = subscription.metadata?.clerk_user_id;
        if (!clerkUserId) break;
        const { data: user } = await supabaseServer.from('users').select('email').eq('id', clerkUserId).single();
        if (user?.email) {
          const priceId = subscription.items.data[0]?.price.id;
          const plan = priceId === process.env.STRIPE_BUSINESS_PRICE_ID ? 'Business' : 'Pro';
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
          await sendEmail(user.email, 'trial_will_end', {
            plan,
            billingUrl: `${baseUrl}/dashboard/billing`,
          });
        }
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    return NextResponse.json(
      { error: 'Webhook failed' },
      { status: 500 }
    );
  }
}
