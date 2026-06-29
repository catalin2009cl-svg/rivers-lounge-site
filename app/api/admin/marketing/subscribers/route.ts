import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  await requireAuth();

  const users = await prisma.user.findMany({
    where: { OR: [{ marketingConsent: true }, { unsubscribedAt: { not: null } }] },
    select: {
      id: true, name: true, email: true, marketingConsent: true,
      marketingConsentAt: true, unsubscribedAt: true, lastOrderAt: true,
      loyaltyProfile: { select: { currentLevel: true } },
    },
    orderBy: { marketingConsentAt: 'desc' },
  });

  return NextResponse.json({
    subscribers: users.map((u) => ({
      id:                u.id,
      name:              u.name,
      email:             u.email,
      marketingConsent:  u.marketingConsent,
      consentAt:         u.marketingConsentAt?.toISOString() ?? null,
      unsubscribedAt:    u.unsubscribedAt?.toISOString()    ?? null,
      lastOrderAt:       u.lastOrderAt?.toISOString()       ?? null,
      loyaltyLevel:      u.loyaltyProfile?.currentLevel     ?? null,
    })),
  });
}
