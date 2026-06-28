import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/actions/auth-user';
import { expireWalletIfNeeded } from '@/lib/loyalty/expireWallet';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
  }

  const body = await req.json() as { orderSubtotal?: number };
  const orderSubtotal = typeof body.orderSubtotal === 'number' ? body.orderSubtotal : 0;

  // Expire stale wallet credits before applying
  await expireWalletIfNeeded(user.id);

  const profile = await prisma.loyaltyProfile.findUnique({
    where: { userId: user.id },
    select: { walletBalance: true, walletExpiresAt: true },
  });

  if (!profile || profile.walletBalance <= 0) {
    return NextResponse.json({ valid: false, error: 'Sold insuficient în portofel' });
  }

  const creditAmount = Math.min(profile.walletBalance, orderSubtotal);
  if (creditAmount <= 0) {
    return NextResponse.json({ valid: false, error: 'Suma comenzii este 0' });
  }

  return NextResponse.json({
    valid: true,
    walletBalance: profile.walletBalance,
    creditAmount,
    walletExpiresAt: profile.walletExpiresAt?.toISOString() ?? null,
  });
}
