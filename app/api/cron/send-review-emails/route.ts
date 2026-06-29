// Runs daily at 20:00 on Vercel Hobby plan (once-per-day limit).
// On Pro plan, change vercel.json schedule to "*/15 * * * *" for more
// precise 2h-after-delivery timing.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendReviewRequestEmail } from '@/lib/email/resend';
import { createHmac } from 'crypto';

export const dynamic = 'force-dynamic';

function generateReviewToken(orderId: string, userId: string): string {
  const secret = process.env.REVIEW_SECRET ?? 'rivers-review-secret-2026';
  return createHmac('sha256', secret).update(`${orderId}:${userId}`).digest('hex').slice(0, 40);
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const twoHoursAndFifteenAgo = new Date(Date.now() - 2.25 * 60 * 60 * 1000);

    // Find orders that became "livrata" ~2h ago, haven't had review email sent, and have a userId
    const orders = await prisma.order.findMany({
      where: {
        status: 'livrata',
        reviewEmailSent: false,
        userId: { not: null },
        updatedAt: { gte: twoHoursAndFifteenAgo, lte: twoHoursAgo },
      },
      select: {
        id: true,
        userId: true,
        user: { select: { email: true, name: true } },
      },
    });

    let sent = 0;
    for (const order of orders) {
      if (!order.userId || !order.user) continue;
      try {
        const token = generateReviewToken(order.id, order.userId);
        await sendReviewRequestEmail(order.user.email, order.user.name, order.id, token);
        await prisma.order.update({
          where: { id: order.id },
          data: { reviewEmailSent: true, reviewEmailSentAt: new Date() },
        });
        sent++;
      } catch {
        // skip individual failures
      }
    }

    return NextResponse.json({ ok: true, sent });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
