import { prisma } from '@/lib/prisma';
import { checkAndUpgradeToLevel4 } from './checkLevelUpgrade';
import type { LoyaltyConfig } from './types';

export async function processReferralCashback(
  completedOrderId: string,
  userId: string,
  orderSubtotal: number,
  config: LoyaltyConfig
): Promise<void> {
  if (!config.level4.enabled) return;

  // Find a referral record where this user was referred
  const referral = await prisma.referral.findUnique({
    where: { referredUserId: userId },
    select: {
      id: true,
      referrerId: true,
      status: true,
      referredOrdersCount: true,
    },
  });

  if (!referral) return;
  if (referral.status === 'COMPLETED') return;

  const maxOrders = config.level4.referralCashbackMaxOrders;
  if (referral.referredOrdersCount >= maxOrders) return;

  // Idempotency: check if this order was already processed for referral cashback
  const alreadyProcessed = await prisma.walletTransaction.findFirst({
    where: {
      userId: referral.referrerId,
      type: 'REFERRAL_CASHBACK',
      sourceOrderId: completedOrderId,
    },
    select: { id: true },
  });
  if (alreadyProcessed) return;

  // Get referrer's loyalty profile
  const referrerProfile = await prisma.loyaltyProfile.findUnique({
    where: { userId: referral.referrerId },
    select: {
      id: true,
      walletBalance: true,
      referralCashbackEarned: true,
      totalReferrals: true,
    },
  });
  if (!referrerProfile) return;

  const eligibleValue = Math.min(orderSubtotal, config.level4.referralCashbackMaxOrderValue);
  const cashbackAmount =
    Math.round(eligibleValue * (config.level4.referralCashbackPercent / 100) * 100) / 100;
  if (cashbackAmount <= 0) return;

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 90);

  const isFirstOrder = referral.referredOrdersCount === 0;
  const newOrdersCount = referral.referredOrdersCount + 1;
  const newStatus = newOrdersCount >= maxOrders ? 'COMPLETED' : isFirstOrder ? 'ACTIVE' : referral.status;

  await prisma.$transaction(async (tx) => {
    const balanceBefore = referrerProfile.walletBalance;
    const balanceAfter = Math.round((balanceBefore + cashbackAmount) * 100) / 100;
    const newReferralCashback =
      Math.round((referrerProfile.referralCashbackEarned + cashbackAmount) * 100) / 100;

    await tx.loyaltyProfile.update({
      where: { id: referrerProfile.id },
      data: {
        walletBalance: balanceAfter,
        walletExpiresAt: expiresAt,
        referralCashbackEarned: newReferralCashback,
        // Increment totalReferrals only on the referred user's first completed order
        ...(isFirstOrder ? { totalReferrals: { increment: 1 } } : {}),
      },
    });

    await tx.walletTransaction.create({
      data: {
        loyaltyProfileId: referrerProfile.id,
        userId: referral.referrerId,
        type: 'REFERRAL_CASHBACK',
        amount: cashbackAmount,
        balanceBefore,
        balanceAfter,
        sourceOrderId: completedOrderId,
        description: `Cashback referral ${config.level4.referralCashbackPercent}% din comanda #${completedOrderId.slice(-6).toUpperCase()} (comanda ${newOrdersCount}/${maxOrders})`,
        expiresAt,
      },
    });

    await tx.referral.update({
      where: { id: referral.id },
      data: {
        referredOrdersCount: newOrdersCount,
        totalCashbackEarned: { increment: cashbackAmount },
        status: newStatus,
      },
    });
  });

  // After incrementing totalReferrals (only on first order), check Level 4 upgrade
  if (isFirstOrder) {
    await checkAndUpgradeToLevel4(referral.referrerId, config);
  }
}
