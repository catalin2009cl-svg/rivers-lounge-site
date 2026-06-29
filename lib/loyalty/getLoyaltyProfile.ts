import { prisma } from '@/lib/prisma';
import { getLoyaltyConfig, calculateLevel, getLevelInfo, getNextLevel } from './config';
import type {
  LoyaltyProfileSummary,
  ActiveReward,
  WalletTransactionSummary,
  ReferralSummary,
} from './types';

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

  // Compute cashback earned in the last 30 days (for Level 3 upgrade progress)
  const since30 = new Date(now);
  since30.setDate(since30.getDate() - 30);
  const cashbackLast30Days = profile.walletTransactions
    .filter((t) => t.type === 'CASHBACK_EARNED' && new Date(t.createdAt) >= since30)
    .reduce((sum, t) => sum + t.amount, 0);

  // Recalculate level in case it drifted
  const recalcLevel = calculateLevel(profile.totalCompletedOrders, config.levels);

  // Level 3 bonus window: null out if expired and not yet chosen
  const level3BonusExpiresAt = (() => {
    if (!profile.level3BonusExpiresAt) return null;
    if (profile.level3BonusChoice) return profile.level3BonusExpiresAt.toISOString();
    if (new Date(profile.level3BonusExpiresAt) <= now) return null;
    return profile.level3BonusExpiresAt.toISOString();
  })();

  // Welcome bonus: check if the REFERRAL_WELCOME transaction has expired
  const welcomeBonusActive = (() => {
    if (!profile.welcomeBonusActive) return false;
    // Find the REFERRAL_WELCOME tx to check its expiry
    const welcomeTx = profile.walletTransactions.find((t) => t.type === 'REFERRAL_WELCOME');
    if (!welcomeTx) return false;
    if (welcomeTx.expiresAt && new Date(welcomeTx.expiresAt) <= now) return false;
    return true;
  })();

  // Referrals made by this user
  const referrals = await prisma.referral.findMany({
    where: { referrerId: userId },
    include: { referredUser: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const referralSummaries: ReferralSummary[] = referrals.map((r) => ({
    id: r.id,
    referredUserFirstName: r.referredUser.name.split(' ')[0],
    status: r.status,
    referredOrdersCount: r.referredOrdersCount,
    totalCashbackEarned: r.totalCashbackEarned,
    createdAt: r.createdAt.toISOString(),
  }));

  // Get user's clientCode for sharing
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { clientCode: true },
  });

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
    totalCashbackEarned: profile.totalCashbackEarned ?? 0,
    cashbackLast30Days: Math.round(cashbackLast30Days * 100) / 100,
    level3BonusChoice: profile.level3BonusChoice ?? null,
    level3BonusExpiresAt,
    level3CashbackBoostLeft: profile.level3CashbackBoostLeft ?? 0,
    priorityDelivery: profile.priorityDelivery ?? false,
    totalReferrals: profile.totalReferrals ?? 0,
    referralCashbackEarned: profile.referralCashbackEarned ?? 0,
    welcomeBonusActive,
    referralCode: user?.clientCode ?? null,
    referrals: referralSummaries,
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
