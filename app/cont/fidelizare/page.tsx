import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth-user';
import { getLoyaltyProfileForUser, getOrCreateLoyaltyProfile } from '@/lib/loyalty/getLoyaltyProfile';
import { getLoyaltyConfig, getLevelInfo, getNextLevel } from '@/lib/loyalty/config';
import { expireWalletIfNeeded } from '@/lib/loyalty/expireWallet';
import { prisma } from '@/lib/prisma';
import { SiteLayout } from '@/components/layout/site-layout';
import { FidelizareClient } from './FidelizareClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Program Fidelizare | River's Lounge",
  description: "Urmărește progresul tău în programul de loialitate Rivers Lounge.",
};

export default async function FidelizarePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/cont/autentificare');

  // Expire stale wallet credits before showing the page
  await expireWalletIfNeeded(user.id);

  const [profile, config] = await Promise.all([
    getLoyaltyProfileForUser(user.id),
    getLoyaltyConfig(),
  ]);

  // Auto-create profile if it doesn't exist
  if (!profile) {
    await getOrCreateLoyaltyProfile(user.id);
  }

  // Fetch all rewards for history
  let rewards: {
    id: string;
    rewardType: string;
    rewardValue: number;
    status: string;
    issuedAt: string;
    expiresAt: string | null;
    usedOnOrderId: string | null;
  }[] = [];

  const rawRewards = await prisma.rewardLedger.findMany({
    where: { userId: user.id },
    orderBy: { issuedAt: 'desc' },
  });
  rewards = rawRewards.map((r) => ({
    id: r.id,
    rewardType: r.rewardType,
    rewardValue: r.rewardValue,
    status: r.status as string,
    issuedAt: r.issuedAt.toISOString(),
    expiresAt: r.expiresAt?.toISOString() ?? null,
    usedOnOrderId: r.usedOnOrderId,
  }));

  const currentOrders = profile?.totalCompletedOrders ?? 0;
  const currentLevel = profile?.currentLevel ?? 1;
  const ordersRequired = config.level1.ordersRequired;
  const activeReward = profile?.activeReward ?? null;
  const levelInfo = getLevelInfo(currentLevel, config.levels);
  const nextLevel = getNextLevel(currentLevel, config.levels);

  return (
    <SiteLayout>
      <FidelizareClient
        userName={user.name}
        currentLevel={currentLevel}
        currentLevelName={levelInfo?.name ?? 'Client Nou'}
        totalCompletedOrders={currentOrders}
        ordersRequired={ordersRequired}
        activeReward={activeReward}
        levels={config.levels}
        rewards={rewards}
        nextLevelName={nextLevel?.name ?? null}
        ordersToNextLevel={nextLevel ? Math.max(0, nextLevel.minOrders - currentOrders) : null}
        walletBalance={profile?.walletBalance ?? 0}
        walletExpiresAt={profile?.walletExpiresAt ?? null}
        walletTransactions={profile?.recentWalletTransactions ?? []}
      />
    </SiteLayout>
  );
}
