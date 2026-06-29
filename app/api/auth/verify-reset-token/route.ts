import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***@***.***';
  return `${local[0]}***@${domain}`;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token') ?? '';

    if (!token) {
      return NextResponse.json({ valid: false });
    }

    const user = await prisma.user.findUnique({
      where: { passwordResetToken: token },
      select: { email: true, passwordResetExpiresAt: true },
    });

    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({ valid: true, email: maskEmail(user.email) });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
