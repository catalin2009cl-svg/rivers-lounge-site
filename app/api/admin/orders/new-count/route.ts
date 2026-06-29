import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  await requireAuth();

  const orders = await prisma.order.findMany({
    where: { status: { in: ['noua', 'in_asteptare'] } },
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  const latestAt = orders[0]?.createdAt?.toISOString() ?? null;

  return NextResponse.json({ count: orders.length, latestAt });
}
