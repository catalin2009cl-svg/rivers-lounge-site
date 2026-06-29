import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendLowRatingAlertEmail } from '@/lib/email/resend';
import { createHmac } from 'crypto';

export const dynamic = 'force-dynamic';

function verifyToken(token: string, orderId: string, userId: string): boolean {
  const secret = process.env.REVIEW_SECRET ?? 'rivers-review-secret-2026';
  const expected = createHmac('sha256', secret).update(`${orderId}:${userId}`).digest('hex').slice(0, 40);
  return token === expected;
}

export async function POST(req: NextRequest) {
  try {
    const { token, orderId, rating, comment } = (await req.json()) as {
      token: string;
      orderId: string;
      rating: number;
      comment?: string;
    };

    if (!token || !orderId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Date invalide.' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        status: true,
        review: { select: { id: true } },
        user: { select: { name: true, email: true } },
      },
    });

    if (!order || !order.userId || order.status !== 'livrata') {
      return NextResponse.json({ error: 'Comandă invalidă.' }, { status: 400 });
    }

    if (order.review) {
      return NextResponse.json({ error: 'Ai lăsat deja o recenzie pentru această comandă.' }, { status: 409 });
    }

    if (!verifyToken(token, orderId, order.userId)) {
      return NextResponse.json({ error: 'Link invalid sau expirat.' }, { status: 403 });
    }

    const isLowRating = rating <= 2;

    await prisma.orderReview.create({
      data: {
        orderId,
        userId: order.userId,
        rating,
        comment: comment?.trim() || null,
        isLowRating,
      },
    });

    if (isLowRating && order.user) {
      try {
        await sendLowRatingAlertEmail(
          orderId,
          order.user.name,
          order.user.email,
          rating,
          comment ?? null
        );
        await prisma.orderReview.update({
          where: { orderId },
          data: { adminAlerted: true },
        });
      } catch {
        // non-fatal
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
