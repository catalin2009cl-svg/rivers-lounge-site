import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get('user_email')?.value;
    if (!email) return NextResponse.json({ error: 'Neautentificat.' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: 'Utilizator inexistent.' }, { status: 404 });

    const credentials = await prisma.webAuthnCredential.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        credentialId: true,
        deviceName: true,
        deviceType: true,
        backedUp: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(credentials);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
