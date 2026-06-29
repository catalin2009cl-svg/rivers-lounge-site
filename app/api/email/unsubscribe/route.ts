import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const base  = 'https://riverslounge.ro';

  if (!token) {
    return NextResponse.redirect(`${base}/unsubscribe?error=invalid`);
  }

  try {
    const log = await prisma.emailLog.findUnique({ where: { trackingId: token } });
    if (!log) {
      return NextResponse.redirect(`${base}/unsubscribe?error=invalid`);
    }

    await prisma.user.update({
      where: { id: log.userId },
      data: { marketingConsent: false, unsubscribedAt: new Date() },
    });

    return NextResponse.redirect(`${base}/unsubscribe?done=1`);
  } catch {
    return NextResponse.redirect(`${base}/unsubscribe?error=failed`);
  }
}
