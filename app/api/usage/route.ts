import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const FREE_DAILY_LIMIT = 1;

function isToday(isoDate: string | null): boolean {
  if (!isoDate) return false;
  const d = new Date(isoDate);
  const today = new Date();
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: user } = await supabaseServer
      .from('users')
      .select('plan, usage_count, usage_reset_at')
      .eq('id', userId)
      .single();

    const plan = (user as { plan?: string } | null)?.plan ?? 'free';
    let used = (user as { usage_count?: number } | null)?.usage_count ?? 0;
    const resetAt = (user as { usage_reset_at?: string } | null)?.usage_reset_at ?? null;

    if (plan === 'free' && !isToday(resetAt)) {
      used = 0;
    }

    const limit = plan === 'free' ? FREE_DAILY_LIMIT : null; // null = unlimited
    const resetAtFormatted = plan === 'free' && resetAt
      ? new Date(resetAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : null;

    return NextResponse.json({
      plan,
      used,
      limit,
      resetAt: resetAtFormatted,
      isUnlimited: plan !== 'free',
    });
  } catch (err) {
    console.error('Usage route error:', err);
    return NextResponse.json({ error: 'Failed to load usage' }, { status: 500 });
  }
}
