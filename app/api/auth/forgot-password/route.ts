import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email/resend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email?: unknown };
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: true });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('[forgot-password] RESEND_API_KEY is not set — cannot send email');
      return NextResponse.json({ success: true });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      console.log('[forgot-password] No active user found for email:', email);
      return NextResponse.json({ success: true });
    }

    // Rate limit: if token was set less than 57 minutes ago, skip
    if (user.passwordResetExpiresAt) {
      const threeMinutesFromNow = new Date(Date.now() + 3 * 60 * 1000);
      if (user.passwordResetExpiresAt > threeMinutesFromNow) {
        console.log('[forgot-password] Rate limit hit for user:', user.email);
        return NextResponse.json({ success: true });
      }
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpiresAt: expiresAt,
      },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://riverslounge.ro';
    const resetLink = `${siteUrl}/resetare-parola?token=${token}`;

    console.log('[forgot-password] Sending reset email to:', user.email);
    console.log('[forgot-password] Reset link:', resetLink);

    await sendPasswordResetEmail(user.email, resetLink, user.name);

    console.log('[forgot-password] Email sent successfully to:', user.email);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[forgot-password] Unexpected error:', err);
    return NextResponse.json({ success: true });
  }
}
