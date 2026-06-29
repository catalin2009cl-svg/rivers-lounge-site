import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get('user_email')?.value;
    if (!email) return NextResponse.json({ error: 'Neautentificat.' }, { status: 401 });

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, webAuthnCredentials: { select: { id: true } } },
    });
    if (!user) return NextResponse.json({ error: 'Utilizator inexistent.' }, { status: 404 });

    const credential = user.webAuthnCredentials.find((c) => c.id === id);
    if (!credential) {
      return NextResponse.json({ error: 'Credential inexistent.' }, { status: 404 });
    }

    await prisma.webAuthnCredential.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
