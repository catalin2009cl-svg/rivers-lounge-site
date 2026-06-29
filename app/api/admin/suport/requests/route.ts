import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const VALID_STATUSES = ['new', 'read', 'replied', 'closed'];

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json() as { id?: unknown; status?: unknown };
    const { id, status } = body;

    if (typeof id !== 'string' || typeof status !== 'string' || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Date invalide.' }, { status: 400 });
    }

    await prisma.supportRequest.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Eroare internă.' }, { status: 500 });
  }
}
