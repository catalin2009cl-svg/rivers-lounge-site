import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getOrCreateLoyaltyProfile } from '@/lib/loyalty/getLoyaltyProfile';
import { getLoyaltyConfig } from '@/lib/loyalty/config';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (session.role === 'operator') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  const body = await req.json() as {
    userId: string;
    rewardType: string;
    rewardValue: number;
    validityDays?: number;
    levelId?: number;
    note?: string;
  };

  if (!body.userId || !body.rewardType || !body.rewardValue) {
    return NextResponse.json({ error: 'Câmpuri obligatorii lipsă' }, { status: 400 });
  }

  const config = await getLoyaltyConfig();
  const profile = await getOrCreateLoyaltyProfile(body.userId);

  const validityDays = body.validityDays ?? config.level1.rewardValidityDays;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + validityDays);

  const uniqueRewardKey = `MANUAL_${body.rewardType}_USER_${body.userId}_${Date.now()}`;

  const reward = await prisma.rewardLedger.create({
    data: {
      userId: body.userId,
      loyaltyProfileId: profile.id,
      rewardType: body.rewardType,
      rewardValue: body.rewardValue,
      levelId: body.levelId ?? null,
      status: 'ACTIVE',
      uniqueRewardKey,
      issuedAt: new Date(),
      expiresAt,
      rewardMetadata: { grantedBy: session.name, note: body.note ?? '' },
    },
  });

  return NextResponse.json({ success: true, reward });
}
