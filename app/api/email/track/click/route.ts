import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const id  = req.nextUrl.searchParams.get('id');
  const url = req.nextUrl.searchParams.get('url');

  if (id) {
    try {
      const log = await prisma.emailLog.findUnique({ where: { trackingId: id } });
      if (log && !log.clickedAt) {
        await prisma.$transaction([
          prisma.emailLog.update({
            where: { trackingId: id },
            data: { status: 'CLICKED', clickedAt: new Date() },
          }),
          prisma.emailCampaign.update({
            where: { id: log.campaignId },
            data: { clickCount: { increment: 1 } },
          }),
        ]);
      }
    } catch {
      // Never fail on tracking errors
    }
  }

  const dest = url && URL.canParse(url) ? url : 'https://riverslounge.ro';
  return NextResponse.redirect(dest);
}
