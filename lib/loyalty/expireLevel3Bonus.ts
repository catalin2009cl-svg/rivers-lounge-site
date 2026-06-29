import { prisma } from '@/lib/prisma';

export async function expireLevel3BonusIfNeeded(userId: string): Promise<void> {
  const profile = await prisma.loyaltyProfile.findUnique({
    where: { userId },
    select: { currentLevel: true, level3BonusChoice: true, level3BonusExpiresAt: true },
  });

  if (!profile) return;
  if (profile.currentLevel < 3) return;
  if (profile.level3BonusChoice) return;
  if (!profile.level3BonusExpiresAt) return;
  if (new Date(profile.level3BonusExpiresAt) > new Date()) return;

  await prisma.loyaltyProfile.update({
    where: { userId },
    data: { level3BonusExpiresAt: null },
  });
}
