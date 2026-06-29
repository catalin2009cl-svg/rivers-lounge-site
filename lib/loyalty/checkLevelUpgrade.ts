import { prisma } from '@/lib/prisma';
import type { LoyaltyConfig } from './types';

export async function checkAndUpgradeToLevel3(
  userId: string,
  loyaltyProfileId: string,
  config: LoyaltyConfig
): Promise<boolean> {
  if (!config.level3.enabled) return false;

  const profile = await prisma.loyaltyProfile.findUnique({
    where: { id: loyaltyProfileId },
    select: { currentLevel: true, level3BonusChoice: true },
  });
  if (!profile || profile.currentLevel >= 3) return false;

  // Sum CASHBACK_EARNED in the last 30 days
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const txns = await prisma.walletTransaction.findMany({
    where: {
      userId,
      type: 'CASHBACK_EARNED',
      createdAt: { gte: since },
    },
    select: { amount: true },
  });

  const total = txns.reduce((sum, t) => sum + t.amount, 0);
  if (total < config.level3.cashbackThreshold30Days) return false;

  const bonusExpiresAt = new Date();
  bonusExpiresAt.setHours(
    bonusExpiresAt.getHours() + config.level3.bonusChoiceWindowHours
  );

  await prisma.loyaltyProfile.update({
    where: { id: loyaltyProfileId },
    data: {
      currentLevel: 3,
      priorityDelivery: true,
      level3BonusExpiresAt: bonusExpiresAt,
    },
  });

  return true;
}

export async function checkAndUpgradeToLevel4(
  userId: string,
  config: LoyaltyConfig
): Promise<boolean> {
  if (!config.level4.enabled) return false;

  const profile = await prisma.loyaltyProfile.findUnique({
    where: { userId },
    select: { currentLevel: true, totalReferrals: true },
  });
  if (!profile) return false;
  // Can upgrade from Level 3 OR via order count already at 4
  // Only trigger if currently at exactly 3 (referral-based fast-track)
  if (profile.currentLevel !== 3) return false;
  if (profile.totalReferrals < config.level4.upgradeReferralsRequired) return false;

  const now = new Date();
  const walletExpiresAt = new Date(now);
  walletExpiresAt.setDate(walletExpiresAt.getDate() + 90);

  await prisma.loyaltyProfile.update({
    where: { userId },
    data: {
      currentLevel: 4,
      priorityDelivery: true,
      walletExpiresAt,
    },
  });

  return true;
}
