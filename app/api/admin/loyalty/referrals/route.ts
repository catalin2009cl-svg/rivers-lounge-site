import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const take = Math.min(parseInt(searchParams.get('limit') ?? '500'), 1000);

    const referrals = await prisma.referral.findMany({
      where: status ? { status: status as 'PENDING' | 'ACTIVE' | 'COMPLETED' } : undefined,
      include: {
        referrer: { select: { name: true, email: true, clientCode: true } },
        referredUser: { select: { name: true, email: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
    });

    const result = referrals.map((r) => ({
      id: r.id,
      referrerId: r.referrerId,
      referrerName: r.referrer.name,
      referrerEmail: r.referrer.email,
      referrerCode: r.referrer.clientCode,
      referredUserId: r.referredUserId,
      referredUserName: r.referredUser.name,
      referredUserEmail: r.referredUser.email,
      referredUserRegisteredAt: r.referredUser.createdAt.toISOString(),
      status: r.status,
      referredOrdersCount: r.referredOrdersCount,
      totalCashbackEarned: r.totalCashbackEarned,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return NextResponse.json({ referrals: result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('Unauthorized') || msg.includes('autentificat')) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 });
  }
}

// Admin manual override: update referral status
export async function PATCH(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json() as { id: string; status: 'PENDING' | 'ACTIVE' | 'COMPLETED' };
    if (!body.id || !body.status) {
      return NextResponse.json({ error: 'Date lipsă' }, { status: 400 });
    }

    const referral = await prisma.referral.update({
      where: { id: body.id },
      data: { status: body.status },
    });

    // If marking as ACTIVE, also increment referrer totalReferrals if not already done
    if (body.status === 'ACTIVE') {
      const existing = await prisma.loyaltyProfile.findUnique({
        where: { userId: referral.referrerId },
        select: { totalReferrals: true },
      });
      if (existing) {
        await prisma.loyaltyProfile.update({
          where: { userId: referral.referrerId },
          data: { totalReferrals: { increment: 1 } },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('Unauthorized') || msg.includes('autentificat')) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 });
  }
}
