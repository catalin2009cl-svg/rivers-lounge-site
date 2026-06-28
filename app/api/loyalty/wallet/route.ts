import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/actions/auth-user';
import { expireWalletIfNeeded } from '@/lib/loyalty/expireWallet';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
  }

  await expireWalletIfNeeded(user.id);

  const profile = await prisma.loyaltyProfile.findUnique({
    where: { userId: user.id },
    select: {
      walletBalance: true,
      walletExpiresAt: true,
      walletTransactions: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });

  if (!profile) {
    return NextResponse.json({ walletBalance: 0, walletExpiresAt: null, transactions: [] });
  }

  return NextResponse.json({
    walletBalance: profile.walletBalance,
    walletExpiresAt: profile.walletExpiresAt?.toISOString() ?? null,
    transactions: profile.walletTransactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      balanceBefore: t.balanceBefore,
      balanceAfter: t.balanceAfter,
      description: t.description,
      sourceOrderId: t.sourceOrderId,
      usedOnOrderId: t.usedOnOrderId,
      expiresAt: t.expiresAt?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
    })),
  });
}
