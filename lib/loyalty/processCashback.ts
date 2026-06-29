import { prisma } from '@/lib/prisma';
import { checkAndUpgradeToLevel3 } from './checkLevelUpgrade';
import type { LoyaltyConfig } from './types';

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
  config: LoyaltyConfig,
  currentLevel: number,
  level3CashbackBoostLeft: number
): Promise<CashbackResult> {
  if (!config.level2.enabled) return { credited: false, creditAmount: 0, newBalance: 0 };

  // Idempotency: skip if cashback already recorded for this order
  const existing = await prisma.walletTransaction.findFirst({
    where: { userId, sourceOrderId: orderId, type: 'CASHBACK_EARNED' },
  });
  if (existing) return { credited: false, creditAmount: 0, newBalance: 0 };

  // Level 4+: always 5% (inherited benefit, no boost counter needed)
  // Level 3 with active boost: 5%
  // Otherwise: level2 base rate (3%)
  const useBoost = currentLevel >= 3 && level3CashbackBoostLeft > 0;
  const cashbackPercent =
    currentLevel >= 4
      ? config.level3.cashbackBoostPercent
      : useBoost
      ? config.level3.cashbackBoostPercent
      : config.level2.cashbackPercent;

  const creditAmount = Math.round(orderSubtotal * (cashbackPercent / 100) * 100) / 100;
  if (creditAmount <= 0) return { credited: false, creditAmount: 0, newBalance: 0 };

  const now = new Date();
  // Level 3+ uses 90-day wallet expiry; Level 2 uses 30-day
  const expiryDays =
    currentLevel >= 3 ? config.level3.walletExpiryDays : config.level2.walletExpiryDays;
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + expiryDays);

  const result = await prisma.$transaction(async (tx) => {
    const profile = await tx.loyaltyProfile.findUnique({
      where: { id: loyaltyProfileId },
      select: { walletBalance: true, totalCashbackEarned: true },
    });
    const balanceBefore = profile?.walletBalance ?? 0;
    const balanceAfter = Math.round((balanceBefore + creditAmount) * 100) / 100;
    const newTotalCashback =
      Math.round(((profile?.totalCashbackEarned ?? 0) + creditAmount) * 100) / 100;

    const updateData: Record<string, unknown> = {
      walletBalance: balanceAfter,
      walletExpiresAt: expiresAt,
      totalCashbackEarned: newTotalCashback,
    };
    // Decrement boost counter only for Level 3 (not Level 4 — Level 4 has permanent 5%)
    if (useBoost && currentLevel === 3) {
      updateData.level3CashbackBoostLeft = level3CashbackBoostLeft - 1;
    }

    await tx.loyaltyProfile.update({
      where: { id: loyaltyProfileId },
      data: updateData,
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
        description: `Cashback ${cashbackPercent}%${useBoost && currentLevel === 3 ? ' (boost activ)' : currentLevel >= 4 ? ' (Silver)' : ''} pe comanda #${orderId.slice(-6).toUpperCase()}`,
        expiresAt,
      },
    });

    return { credited: true, creditAmount, newBalance: balanceAfter };
  });

  // For Level 2 users: check if they've now earned enough to upgrade to Level 3
  if (currentLevel === 2) {
    await checkAndUpgradeToLevel3(userId, loyaltyProfileId, config);
  }

  return result;
}
