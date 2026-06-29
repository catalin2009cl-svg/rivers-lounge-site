import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendCampaign } from '@/lib/email/sendCampaign';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAuth();
  const { id } = await params;
  const body = await req.json() as { scheduledAt?: string; title?: string; subject?: string };

  const campaign = await prisma.emailCampaign.findUnique({ where: { id } });
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (campaign.status !== 'DRAFT') {
    return NextResponse.json({ error: 'Campania nu este în stare DRAFT.' }, { status: 400 });
  }

  // Apply any title/subject updates
  if (body.title || body.subject) {
    await prisma.emailCampaign.update({
      where: { id },
      data: {
        ...(body.title   && { title:   body.title }),
        ...(body.subject && { subject: body.subject }),
      },
    });
  }

  if (body.scheduledAt) {
    await prisma.emailCampaign.update({
      where: { id },
      data: { status: 'SCHEDULED', scheduledAt: new Date(body.scheduledAt) },
    });
    return NextResponse.json({ status: 'SCHEDULED' });
  }

  // Send immediately (awaited — works for small lists; cron handles large scheduled ones)
  await sendCampaign(id);
  return NextResponse.json({ status: 'SENT' });
}
