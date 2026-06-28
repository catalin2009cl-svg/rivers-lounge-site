import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (session.role === 'operator') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  const { id } = await params;
  const reward = await prisma.rewardLedger.findUnique({ where: { id } });
  if (!reward) return NextResponse.json({ error: 'Recompensa nu există' }, { status: 404 });
  if (reward.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Doar recompensele active pot fi anulate' }, { status: 400 });
  }

  await prisma.rewardLedger.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  return NextResponse.json({ success: true });
}
