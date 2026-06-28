import { prisma } from '@/lib/prisma';
import type { LoyaltyLevel2Config } from './types';

interface CashbackResult {
  credited: boolean;
  creditAmount: number;
  newBalance: number;
}

export async function processCashback(
  userId: string,
  loyaltyProfileId: string,
  orderId: string,
  orderSubtotal: number,
  level2Config: LoyaltyLevel2Config
): Promise<CashbackResult> {
  if (!level2Config.enabled) return { credited: false, creditAmount: 0, newBalance: 0 };

  // Idempotency: skip if cashback already recorded for this order
  const existing = await prisma.walletTransaction.findFirst({
    where: { userId, sourceOrderId: orderId, type: 'CASHBACK_EARNED' },
  });
  if (existing) return { credited: false, creditAmount: 0, newBalance: 0 };

  const creditAmount = Math.round(orderSubtotal * (level2Config.cashbackPercent / 100) * 100) / 100;
  if (creditAmount <= 0) return { credited: false, creditAmount: 0, newBalance: 0 };

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + level2Config.walletExpiryDays);

  const result = await prisma.$transaction(async (tx) => {
    const profile = await tx.loyaltyProfile.findUnique({
      where: { id: loyaltyProfileId },
      select: { walletBalance: true },
    });
    const balanceBefore = profile?.walletBalance ?? 0;
    const balanceAfter = Math.round((balanceBefore + creditAmount) * 100) / 100;

    await tx.loyaltyProfile.update({
      where: { id: loyaltyProfileId },
      data: { walletBalance: balanceAfter, walletExpiresAt: expiresAt },
    });

    await tx.walletTransaction.create({
      data: {
        loyaltyProfileId,
        userId,
        type: 'CASHBACK_EARNED',
        amount: creditAmount,
        balanceBefore,
        balanceAfter,
        sourceOrderId: orderId,
        description: `Cashback ${level2Config.cashbackPercent}% pe comanda #${orderId.slice(-6).toUpperCase()}`,
        expiresAt,
      },
    });

    return { credited: true, creditAmount, newBalance: balanceAfter };
  });

  return result;
}
