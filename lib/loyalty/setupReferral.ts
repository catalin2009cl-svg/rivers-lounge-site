import { prisma } from '@/lib/prisma';
import { getLoyaltyConfig } from './config';

export async function setupReferralOnRegistration(
  newUserId: string,
  referralCode: string
): Promise<void> {
  const config = await getLoyaltyConfig();
  if (!config.level4.welcomeBonusEnabled) return;

  // Normalize the code to uppercase
  const code = referralCode.trim().toUpperCase();

  // Find the referrer by clientCode
  const referrer = await prisma.user.findFirst({
    where: { clientCode: code },
    select: { id: true },
  });
  if (!referrer) return;
  if (referrer.id === newUserId) return; // can't refer yourself

  // Guard: a referral record for this new user must not already exist
  const existingReferral = await prisma.referral.findUnique({
    where: { referredUserId: newUserId },
  });
  if (existingReferral) return;

  const now = new Date();
  const bonusExpiresAt = new Date(now);
  bonusExpiresAt.setDate(bonusExpiresAt.getDate() + config.level4.welcomeBonusExpiryDays);

  await prisma.$transaction(async (tx) => {
    // Create or update the new user's loyalty profile: Level 2 + 30 RON credit
    const existingProfile = await tx.loyaltyProfile.findUnique({
      where: { userId: newUserId },
      select: { id: true, walletBalance: true },
    });

    let profileId: string;

    if (existingProfile) {
      profileId = existingProfile.id;
      const newBalance =
        Math.round((existingProfile.walletBalance + config.level4.welcomeBonusCreditAmount) * 100) / 100;
      await tx.loyaltyProfile.update({
        where: { userId: newUserId },
        data: {
          currentLevel: 2,
          walletBalance: newBalance,
          walletExpiresAt: bonusExpiresAt,
          welcomeBonusActive: true,
        },
      });
      await tx.walletTransaction.create({
        data: {
          loyaltyProfileId: profileId,
          userId: newUserId,
          type: 'REFERRAL_WELCOME',
          amount: config.level4.welcomeBonusCreditAmount,
          balanceBefore: existingProfile.walletBalance,
          balanceAfter: newBalance,
          description: `Credit bun venit — folosibil pe comenzi de minimum ${config.level4.welcomeBonusMinOrderValue} RON`,
          expiresAt: bonusExpiresAt,
        },
      });
    } else {
      const newProfile = await tx.loyaltyProfile.create({
        data: {
          userId: newUserId,
          currentLevel: 2,
          walletBalance: config.level4.welcomeBonusCreditAmount,
          walletExpiresAt: bonusExpiresAt,
          welcomeBonusActive: true,
        },
      });
      profileId = newProfile.id;
      await tx.walletTransaction.create({
        data: {
          loyaltyProfileId: profileId,
          userId: newUserId,
          type: 'REFERRAL_WELCOME',
          amount: config.level4.welcomeBonusCreditAmount,
          balanceBefore: 0,
          balanceAfter: config.level4.welcomeBonusCreditAmount,
          description: `Credit bun venit — folosibil pe comenzi de minimum ${config.level4.welcomeBonusMinOrderValue} RON`,
          expiresAt: bonusExpiresAt,
        },
      });
    }

    // Create the Referral record
    await tx.referral.create({
      data: {
        referrerId: referrer.id,
        referredUserId: newUserId,
        status: 'PENDING',
      },
    });

    // Store referredByCode on the User record
    await tx.user.update({
      where: { id: newUserId },
      data: { referredByCode: code },
    });
  });
}
