import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { code?: string };
    const code = (body.code ?? '').trim().toUpperCase();

    if (!code || !/^RL-[A-Z0-9]{4,8}$/.test(code)) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    const user = await prisma.user.findFirst({
      where: { clientCode: code, isActive: true },
      select: { name: true },
    });

    if (!user) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    // Return only first name — no sensitive info
    const firstName = user.name.split(' ')[0];
    return NextResponse.json({ valid: true, referrerName: firstName }, { status: 200 });
  } catch {
    return NextResponse.json({ valid: false }, { status: 200 });
  }
}
