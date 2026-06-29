import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAuth();
  const { id } = await params;

  const campaign = await prisma.emailCampaign.findUnique({ where: { id } });
  if (!campaign || campaign.status !== 'SCHEDULED') {
    return NextResponse.json({ error: 'Campania nu este programată.' }, { status: 400 });
  }

  await prisma.emailCampaign.update({ where: { id }, data: { status: 'CANCELLED' } });
  return NextResponse.json({ success: true });
}
