import { prisma } from '@/lib/prisma';
import { getLoyaltyConfig, calculateLevel, getLevelInfo, getNextLevel } from './config';
import type { LoyaltyProfileSummary, ActiveReward, WalletTransactionSummary } from './types';

export async function getLoyaltyProfileForUser(userId: string): Promise<LoyaltyProfileSummary | null> {
  const profile = await prisma.loyaltyProfile.findUnique({
    where: { userId },
    include: {
      rewards: {
        where: { status: 'ACTIVE' },
        orderBy: { issuedAt: 'desc' },
      },
      walletTransactions: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!profile) return null;

  const config = await getLoyaltyConfig();
  const levelInfo = getLevelInfo(profile.currentLevel, config.levels);
  const nextLevel = getNextLevel(profile.currentLevel, config.levels);

  const now = new Date();
  const activeReward = profile.rewards.find(
    (r) => !r.expiresAt || new Date(r.expiresAt) > now
  ) ?? null;

  const activeRewardOut: ActiveReward | null = activeReward
    ? {
        id: activeReward.id,
        rewardType: activeReward.rewardType,
        rewardValue: activeReward.rewardValue,
        expiresAt: activeReward.expiresAt?.toISOString() ?? null,
        levelId: activeReward.levelId,
      }
    : null;

  const walletExpired =
    profile.walletExpiresAt && new Date(profile.walletExpiresAt) <= now;
  const walletBalance = walletExpired ? 0 : profile.walletBalance;
  const walletExpiresAt = walletExpired
    ? null
    : profile.walletExpiresAt?.toISOString() ?? null;

  const recentWalletTransactions: WalletTransactionSummary[] = profile.walletTransactions.map(
    (t) => ({
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
    })
  );

  // Recalculate level in case it drifted
  const recalcLevel = calculateLevel(profile.totalCompletedOrders, config.levels);

  return {
    id: profile.id,
    userId: profile.userId,
    totalCompletedOrders: profile.totalCompletedOrders,
    currentLevel: recalcLevel,
    currentLevelName: levelInfo?.name ?? 'Client Nou',
    nextLevelName: nextLevel?.name ?? null,
    ordersToNextLevel: nextLevel ? nextLevel.minOrders - profile.totalCompletedOrders : null,
    totalSpentEligible: profile.totalSpentEligible,
    firstCompletedOrderAt: profile.firstCompletedOrderAt?.toISOString() ?? null,
    lastCompletedOrderAt: profile.lastCompletedOrderAt?.toISOString() ?? null,
    activeReward: activeRewardOut,
    walletBalance,
    walletExpiresAt,
    recentWalletTransactions,
  };
}

export async function getOrCreateLoyaltyProfile(userId: string) {
  let profile = await prisma.loyaltyProfile.findUnique({ where: { userId } });
  if (!profile) {
    profile = await prisma.loyaltyProfile.create({
      data: { userId },
    });
  }
  return profile;
}
