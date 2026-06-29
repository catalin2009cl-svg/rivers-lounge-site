import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import type { AuthenticatorTransportFuture } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';
import { rpID, rpName } from '@/lib/webauthn';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get('user_email')?.value;
    if (!email) return NextResponse.json({ error: 'Neautentificat.' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email },
      include: { webAuthnCredentials: { select: { credentialId: true, transports: true } } },
    });
    if (!user) return NextResponse.json({ error: 'Utilizator inexistent.' }, { status: 404 });

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: Buffer.from(user.id) as unknown as Uint8Array<ArrayBuffer>,
      userName: user.email,
      userDisplayName: user.name ?? user.email,
      attestationType: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      excludeCredentials: user.webAuthnCredentials.map((c) => ({
        id: c.credentialId,
        type: 'public-key' as const,
        transports: c.transports as AuthenticatorTransportFuture[],
      })),
    });

    // Store challenge (valid 5 minutes)
    await prisma.user.update({
      where: { id: user.id },
      data: { webAuthnChallenge: options.challenge },
    });

    return NextResponse.json(options);
  } catch (err) {
    console.error('[WebAuthn] register/options error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
