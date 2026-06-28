import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getLoyaltyConfig, getLevelInfo, getNextLevel } from '@/lib/loyalty/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  await requireAuth();

  const [profiles, config] = await Promise.all([
    prisma.loyaltyProfile.findMany({
      include: {
        user: { select: { name: true, email: true } },
        rewards: { where: { status: 'ACTIVE' } },
      },
      orderBy: { totalCompletedOrders: 'desc' },
    }),
    getLoyaltyConfig(),
  ]);

  const now = new Date();

  const users = profiles.map((p) => {
    const levelInfo = getLevelInfo(p.currentLevel, config.levels);
    const nextLevel = getNextLevel(p.currentLevel, config.levels);
    const hasActiveReward = p.rewards.some(
      (r) => !r.expiresAt || new Date(r.expiresAt) > now
    );

    return {
      id: p.id,
      userId: p.userId,
      name: p.user.name,
      email: p.user.email,
      currentLevel: p.currentLevel,
      currentLevelName: levelInfo?.name ?? 'Client Nou',
      totalCompletedOrders: p.totalCompletedOrders,
      ordersToNextLevel: nextLevel
        ? Math.max(0, nextLevel.minOrders - p.totalCompletedOrders)
        : null,
      nextLevelName: nextLevel?.name ?? null,
      firstCompletedOrderAt: p.firstCompletedOrderAt?.toISOString() ?? null,
      hasActiveReward,
    };
  });

  return NextResponse.json({ users });
}
