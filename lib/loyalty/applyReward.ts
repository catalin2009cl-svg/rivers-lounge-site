import { prisma } from '@/lib/prisma';

interface ApplyRewardInput {
  rewardId: string;
  userId: string;
  orderId: string;
  orderSubtotal: number;
  hasOtherDiscount: boolean;
}

interface ApplyRewardResult {
  success: boolean;
  discountAmount?: number;
  error?: string;
}

export async function validateReward(
  rewardId: string,
  userId: string
): Promise<{ valid: boolean; reward?: { rewardValue: number; expiresAt: Date | null }; error?: string }> {
  const reward = await prisma.rewardLedger.findUnique({ where: { id: rewardId } });

  if (!reward) return { valid: false, error: 'Recompensa nu a fost găsită.' };
  if (reward.userId !== userId) return { valid: false, error: 'Recompensa nu îți aparține.' };
  if (reward.status !== 'ACTIVE') return { valid: false, error: 'Recompensa nu mai este activă.' };
  if (reward.expiresAt && new Date(reward.expiresAt) < new Date()) {
    await prisma.rewardLedger.update({ where: { id: rewardId }, data: { status: 'EXPIRED' } });
    return { valid: false, error: 'Recompensa a expirat.' };
  }

  return { valid: true, reward: { rewardValue: reward.rewardValue, expiresAt: reward.expiresAt } };
}

export async function applyRewardToOrder(input: ApplyRewardInput): Promise<ApplyRewardResult> {
  const { rewardId, userId, orderId, orderSubtotal, hasOtherDiscount } = input;

  if (hasOtherDiscount) {
    return { success: false, error: 'Nu poți combina recompensa cu alt cod de reducere.' };
  }

  const validation = await validateReward(rewardId, userId);
  if (!validation.valid || !validation.reward) {
    return { success: false, error: validation.error };
  }

  const discountAmount = Math.min(validation.reward.rewardValue, orderSubtotal);

  await prisma.rewardLedger.update({
    where: { id: rewardId },
    data: {
      status: 'USED',
      usedAt: new Date(),
      usedOnOrderId: orderId,
    },
  });

  return { success: true, discountAmount };
}
