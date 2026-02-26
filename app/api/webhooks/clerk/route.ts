import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { supabaseServer } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const clerkWebhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    if (!clerkWebhookSecret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignature = req.headers.get('svix-signature');
    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: 'Missing Svix headers' }, { status: 400 });
    }

    const body = await req.text();
    const wh = new Webhook(clerkWebhookSecret);
    let payload: { type?: string; data?: { id?: string; email_addresses?: { email_address: string }[] } };
    try {
      payload = wh.verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as typeof payload;
    } catch {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    if (payload.type === 'user.created') {
      const userId = payload.data?.id;
      const email = payload.data?.email_addresses?.[0]?.email_address;
      if (userId) {
        await supabaseServer.from('users').upsert(
          {
            id: userId,
            email: email ?? null,
            plan: 'free',
            usage_count: 0,
            usage_reset_at: null,
            stripe_customer_id: null,
          },
          { onConflict: 'id' }
        );
        if (email) {
          await sendEmail(email, 'welcome', {});
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Clerk webhook error:', err);
    return NextResponse.json(
      { error: 'Webhook failed' },
      { status: 500 }
    );
  }
}
