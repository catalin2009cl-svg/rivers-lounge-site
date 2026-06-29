import { requireAuth } from '@/lib/auth';
import { getLoyaltyConfig } from '@/lib/loyalty/config';
import { prisma } from '@/lib/prisma';
import { LoyaltyAdminClient } from './LoyaltyAdminClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Program Loialitate | Admin River's Lounge",
};

export default async function LoyalitatePage() {
  const session = await requireAuth();

  const [config, profiles, rewards] = await Promise.all([
    getLoyaltyConfig(),
    prisma.loyaltyProfile.findMany({
      include: {
        user: { select: { name: true, email: true } },
        rewards: { where: { status: 'ACTIVE' } },
      },
      orderBy: { totalCompletedOrders: 'desc' },
    }),
    prisma.rewardLedger.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { issuedAt: 'desc' },
      take: 500,
    }),
  ]);

  const now = new Date();

  const usersData = profiles.map((p) => {
    const walletExpired = p.walletExpiresAt && new Date(p.walletExpiresAt) <= now;
    return {
      id: p.id,
      userId: p.userId,
      name: p.user.name,
      email: p.user.email,
      currentLevel: p.currentLevel,
      totalCompletedOrders: p.totalCompletedOrders,
      firstCompletedOrderAt: p.firstCompletedOrderAt?.toISOString() ?? null,
      hasActiveReward: p.rewards.some((r) => !r.expiresAt || new Date(r.expiresAt) > now),
      walletBalance: walletExpired ? 0 : p.walletBalance,
      walletExpiresAt: walletExpired ? null : (p.walletExpiresAt?.toISOString() ?? null),
      priorityDelivery: p.priorityDelivery ?? false,
      level3BonusChoice: p.level3BonusChoice ?? null,
      level3CashbackBoostLeft: p.level3CashbackBoostLeft ?? 0,
      totalCashbackEarned: p.totalCashbackEarned ?? 0,
      totalReferrals: p.totalReferrals ?? 0,
      referralCashbackEarned: p.referralCashbackEarned ?? 0,
    };
  });

  const rewardsData = rewards.map((r) => ({
    id: r.id,
    userId: r.userId,
    userName: r.user.name,
    userEmail: r.user.email,
    rewardType: r.rewardType,
    rewardValue: r.rewardValue,
    status: r.status as string,
    levelId: r.levelId,
    issuedAt: r.issuedAt.toISOString(),
    expiresAt: r.expiresAt?.toISOString() ?? null,
    usedAt: r.usedAt?.toISOString() ?? null,
    usedOnOrderId: r.usedOnOrderId,
    triggerOrderId: r.triggerOrderId,
  }));

  const stats = {
    totalIssued: rewards.length,
    totalUsed: rewards.filter((r) => r.status === 'USED').length,
    totalExpired: rewards.filter((r) => r.status === 'EXPIRED').length,
    totalValueIssued: rewards.reduce((s, r) => s + r.rewardValue, 0),
    totalValueRedeemed: rewards
      .filter((r) => r.status === 'USED')
      .reduce((s, r) => s + r.rewardValue, 0),
  };

  return (
    <LoyaltyAdminClient
      config={config}
      users={usersData}
      rewards={rewardsData}
      stats={stats}
      canEdit={session.role === 'admin'}
    />
  );
}
