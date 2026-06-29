import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import type { AuthenticatorTransportFuture } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';
import { rpID } from '@/lib/webauthn';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json() as { email: string };
    if (!email) return NextResponse.json({ error: 'Email necesar.' }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        isActive: true,
        webAuthnCredentials: {
          select: { credentialId: true, transports: true },
        },
      },
    });

    if (!user || !user.isActive || user.webAuthnCredentials.length === 0) {
      return NextResponse.json(
        { error: 'Nu ai Face ID înregistrat pe acest cont.' },
        { status: 404 }
      );
    }

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'required',
      allowCredentials: user.webAuthnCredentials.map((c) => ({
        id: c.credentialId,
        type: 'public-key' as const,
        transports: c.transports as AuthenticatorTransportFuture[],
      })),
    });

    // Store challenge
    await prisma.user.update({
      where: { id: user.id },
      data: { webAuthnChallenge: options.challenge },
    });

    return NextResponse.json(options);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
