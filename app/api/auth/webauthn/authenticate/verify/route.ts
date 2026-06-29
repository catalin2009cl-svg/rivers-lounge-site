import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';
import { rpID, origin, CHALLENGE_TTL_MS } from '@/lib/webauthn';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, authenticationResponse } = await req.json() as {
      email: string;
      authenticationResponse: AuthenticationResponseJSON;
    };

    if (!email || !authenticationResponse) {
      return NextResponse.json({ error: 'Date invalide.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        isActive: true,
        webAuthnChallenge: true,
        updatedAt: true,
        webAuthnCredentials: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Cont invalid.' }, { status: 401 });
    }

    if (!user.webAuthnChallenge) {
      return NextResponse.json({ error: 'Sesiune expirată. Încearcă din nou.' }, { status: 400 });
    }

    if (Date.now() - user.updatedAt.getTime() > CHALLENGE_TTL_MS) {
      await prisma.user.update({ where: { id: user.id }, data: { webAuthnChallenge: null } });
      return NextResponse.json({ error: 'Sesiune expirată. Încearcă din nou.' }, { status: 400 });
    }

    // Find the matching credential
    const credential = user.webAuthnCredentials.find(
      (c) => c.credentialId === authenticationResponse.id
    );
    if (!credential) {
      return NextResponse.json({ error: 'Credential invalid.' }, { status: 401 });
    }

    const verification = await verifyAuthenticationResponse({
      response: authenticationResponse,
      expectedChallenge: user.webAuthnChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: credential.credentialId,
        publicKey: new Uint8Array(credential.publicKey),
        counter: Number(credential.counter),
        transports: credential.transports as Parameters<typeof verifyAuthenticationResponse>[0]['credential']['transports'],
      },
    });

    if (!verification.verified) {
      return NextResponse.json({ error: 'Autentificare eșuată.' }, { status: 401 });
    }

    const { newCounter } = verification.authenticationInfo;

    // Update credential counter + clear challenge + update lastUsedAt
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { webAuthnChallenge: null },
      }),
      prisma.webAuthnCredential.update({
        where: { id: credential.id },
        data: { counter: BigInt(newCounter), lastUsedAt: new Date() },
      }),
    ]);

    // Set user session cookie (same as password login)
    const response = NextResponse.json({ ok: true });
    response.cookies.set('user_email', user.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
