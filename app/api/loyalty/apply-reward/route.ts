import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserByEmail } from '@/lib/server-data';
import { validateReward } from '@/lib/loyalty/applyReward';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const email = cookieStore.get('user_email')?.value;
  if (!email) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Utilizator negăsit' }, { status: 404 });

  const body = await req.json() as { rewardId: string; orderSubtotal: number };
  if (!body.rewardId) return NextResponse.json({ error: 'rewardId lipsă' }, { status: 400 });

  const result = await validateReward(body.rewardId, user.id);
  if (!result.valid || !result.reward) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const discountAmount = Math.min(result.reward.rewardValue, body.orderSubtotal ?? 0);

  return NextResponse.json({
    valid: true,
    rewardValue: result.reward.rewardValue,
    discountAmount,
    expiresAt: result.reward.expiresAt?.toISOString() ?? null,
  });
}
