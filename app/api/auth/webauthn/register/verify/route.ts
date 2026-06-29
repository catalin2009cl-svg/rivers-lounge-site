import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { RegistrationResponseJSON, AuthenticatorTransportFuture } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';
import { rpID, origin, CHALLENGE_TTL_MS } from '@/lib/webauthn';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get('user_email')?.value;
    if (!email) return NextResponse.json({ error: 'Neautentificat.' }, { status: 401 });

    const body = await req.json() as { registrationResponse: RegistrationResponseJSON; deviceName?: string };

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, webAuthnChallenge: true, updatedAt: true },
    });
    if (!user?.webAuthnChallenge) {
      return NextResponse.json({ error: 'Sesiune de înregistrare expirată.' }, { status: 400 });
    }

    // Check challenge TTL
    if (Date.now() - user.updatedAt.getTime() > CHALLENGE_TTL_MS) {
      await prisma.user.update({ where: { id: user.id }, data: { webAuthnChallenge: null } });
      return NextResponse.json({ error: 'Sesiune de înregistrare expirată. Încearcă din nou.' }, { status: 400 });
    }

    const verification = await verifyRegistrationResponse({
      response: body.registrationResponse,
      expectedChallenge: user.webAuthnChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: 'Verificare eșuată.' }, { status: 400 });
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    // Clear challenge and save credential
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { webAuthnChallenge: null } }),
      prisma.webAuthnCredential.create({
        data: {
          userId: user.id,
          credentialId: credential.id,
          publicKey: Buffer.from(credential.publicKey),
          counter: BigInt(credential.counter),
          deviceType: credentialDeviceType,
          deviceName: body.deviceName ?? null,
          backedUp: credentialBackedUp,
          transports: (credential.transports ?? []) as AuthenticatorTransportFuture[],
        },
      }),
    ]);

    return NextResponse.json({ ok: true, credentialId: credential.id });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
