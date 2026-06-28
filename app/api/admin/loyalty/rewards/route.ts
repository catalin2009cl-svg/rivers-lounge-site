import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  await requireAuth();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const levelId = searchParams.get('levelId');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const rewards = await prisma.rewardLedger.findMany({
    where: {
      ...(status && status !== 'all' ? { status: status as never } : {}),
      ...(type ? { rewardType: type } : {}),
      ...(levelId ? { levelId: parseInt(levelId) } : {}),
      ...(from || to
        ? {
            issuedAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { issuedAt: 'desc' },
  });

  const stats = {
    totalIssued: rewards.length,
    totalUsed: rewards.filter((r) => r.status === 'USED').length,
    totalExpired: rewards.filter((r) => r.status === 'EXPIRED').length,
    totalValueIssued: rewards.reduce((s, r) => s + r.rewardValue, 0),
    totalValueRedeemed: rewards
      .filter((r) => r.status === 'USED')
      .reduce((s, r) => s + r.rewardValue, 0),
  };

  return NextResponse.json({ rewards, stats });
}
