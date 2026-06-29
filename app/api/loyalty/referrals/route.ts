import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/actions/auth-user';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Neautentificat' }, { status: 401 });
    }

    const referrals = await prisma.referral.findMany({
      where: { referrerId: user.id },
      include: {
        referredUser: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = referrals.map((r) => ({
      id: r.id,
      referredUserFirstName: r.referredUser.name.split(' ')[0],
      status: r.status,
      referredOrdersCount: r.referredOrdersCount,
      totalCashbackEarned: r.totalCashbackEarned,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({ referrals: result });
  } catch {
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 });
  }
}
