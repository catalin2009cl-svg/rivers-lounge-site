import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, scryptSync } from 'crypto';
import { prisma } from '@/lib/prisma';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { token?: unknown; newPassword?: unknown };
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!token) {
      return NextResponse.json({ error: 'Link invalid sau expirat.' }, { status: 400 });
    }

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Parola trebuie să aibă cel puțin 8 caractere.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { passwordResetToken: token },
    });

    if (!user) {
      return NextResponse.json({ error: 'Link invalid sau expirat.' }, { status: 400 });
    }

    if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Linkul a expirat. Solicită un nou link de resetare.' },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(newPassword),
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Eroare internă. Încearcă din nou.' }, { status: 500 });
  }
}
