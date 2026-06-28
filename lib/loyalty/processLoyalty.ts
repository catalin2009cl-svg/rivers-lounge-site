import { prisma } from '@/lib/prisma';
import { getLoyaltyConfig, calculateLevel } from './config';
import { getOrCreateLoyaltyProfile } from './getLoyaltyProfile';
import { processCashback } from './processCashback';

interface ProcessResult {
  rewarded: boolean;
  rewardValue?: number;
  expiresAt?: Date;
  cashbackCredited?: boolean;
  cashbackAmount?: number;
}

// orderSubtotal is passed directly from the caller (JSON order store has the subtotal)
export async function processOrderForLoyalty(
  orderId: string,
  userId: string,
  orderSubtotal: number
): Promise<ProcessResult | null> {
  const config = await getLoyaltyConfig();
  if (!config.enabled) return null;

  const profile = await getOrCreateLoyaltyProfile(userId);

  // Idempotency: stop if already processed
  if (profile.processedOrderIds.includes(orderId)) return null;

  const now = new Date();

  const newProcessedOrderIds = [...profile.processedOrderIds, orderId];
  const newTotalCompletedOrders = profile.totalCompletedOrders + 1;
  const newTotalSpentEligible = profile.totalSpentEligible + orderSubtotal;
  const newLevel = calculateLevel(newTotalCompletedOrders, config.levels);

  await prisma.loyaltyProfile.update({
    where: { userId },
    data: {
      totalCompletedOrders: newTotalCompletedOrders,
      totalSpentEligible: newTotalSpentEligible,
      processedOrderIds: newProcessedOrderIds,
      lastCompletedOrderAt: now,
      currentLevel: newLevel,
      firstCompletedOrderAt: profile.firstCompletedOrderAt ?? now,
    },
  });

  // Level 1: grant free 10th order after N completed orders (default: 9)
  const { level1 } = config;
  if (level1.enabled && newTotalCompletedOrders === level1.ordersRequired) {
    const uniqueRewardKey = `LEVEL_1_FREE_10TH_ORDER_USER_${userId}`;

    const existing = await prisma.rewardLedger.findUnique({ where: { uniqueRewardKey } });
    if (!existing) {
      // Use the current order subtotal as the base for reward value (max freeOrderMaxValue)
      const rewardValue = Math.min(orderSubtotal, level1.freeOrderMaxValue);

      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + level1.rewardValidityDays);

      await prisma.rewardLedger.create({
        data: {
          userId,
          loyaltyProfileId: profile.id,
          rewardType: 'FREE_ORDER',
          rewardValue,
          levelId: 1,
          status: 'ACTIVE',
          uniqueRewardKey,
          triggerOrderId: orderId,
          issuedAt: now,
          expiresAt,
          rewardMetadata: {
            maxValue: rewardValue,
            validityDays: level1.rewardValidityDays,
          },
        },
      });

      return { rewarded: true, rewardValue, expiresAt };
    }
  }

  // Level 2+: cashback on every completed order
  const { level2 } = config;
  if (level2.enabled && newLevel >= 2) {
    const cashbackResult = await processCashback(
      userId,
      profile.id,
      orderId,
      orderSubtotal,
      level2
    );
    return {
      rewarded: false,
      cashbackCredited: cashbackResult.credited,
      cashbackAmount: cashbackResult.creditAmount,
    };
  }

  return { rewarded: false };
}
