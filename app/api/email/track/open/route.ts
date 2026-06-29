import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// 1×1 transparent GIF
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');

  if (id) {
    try {
      const log = await prisma.emailLog.findUnique({ where: { trackingId: id } });
      if (log && !log.openedAt) {
        await prisma.$transaction([
          prisma.emailLog.update({
            where: { trackingId: id },
            data: { status: 'OPENED', openedAt: new Date() },
          }),
          prisma.emailCampaign.update({
            where: { id: log.campaignId },
            data: { openCount: { increment: 1 } },
          }),
        ]);
      }
    } catch {
      // Never fail on tracking errors
    }
  }

  return new NextResponse(PIXEL, {
    headers: {
      'Content-Type':  'image/gif',
      'Cache-Control': 'no-cache,no-store,must-revalidate',
    },
  });
}
