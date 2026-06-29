import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendCampaign } from '@/lib/email/sendCampaign';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const due = await prisma.emailCampaign.findMany({
    where: { status: 'SCHEDULED', scheduledAt: { lte: new Date() } },
  });

  const results: { id: string; status: string; error?: string }[] = [];

  for (const campaign of due) {
    try {
      await sendCampaign(campaign.id);
      results.push({ id: campaign.id, status: 'sent' });
    } catch (err) {
      results.push({ id: campaign.id, status: 'error', error: String(err) });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
