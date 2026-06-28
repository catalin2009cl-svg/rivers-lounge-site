import { prisma } from '@/lib/prisma';

export async function expireWalletIfNeeded(userId: string): Promise<void> {
  const profile = await prisma.loyaltyProfile.findUnique({
    where: { userId },
    select: { id: true, walletBalance: true, walletExpiresAt: true },
  });

  if (!profile) return;
  if (profile.walletBalance <= 0) return;
  if (!profile.walletExpiresAt) return;

  const now = new Date();
  if (new Date(profile.walletExpiresAt) > now) return;

  await prisma.$transaction(async (tx) => {
    const expiredAmount = profile.walletBalance;

    await tx.loyaltyProfile.update({
      where: { id: profile.id },
      data: { walletBalance: 0, walletExpiresAt: null },
    });

    await tx.walletTransaction.create({
      data: {
        loyaltyProfileId: profile.id,
        userId,
        type: 'CREDIT_EXPIRED',
        amount: -expiredAmount,
        balanceBefore: expiredAmount,
        balanceAfter: 0,
        description: `Credit expirat (${expiredAmount.toFixed(2)} RON)`,
      },
    });
  });
}
