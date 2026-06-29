import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const SETTINGS_KEY = 'cabana-config';

export async function GET() {
  await requireAuth();
  const row = await prisma.siteSettings.findUnique({ where: { key: SETTINGS_KEY } });
  if (!row) return NextResponse.json(null);
  return NextResponse.json(row.value);
}

export async function PUT(req: NextRequest) {
  await requireAuth();
  const body = await req.json();
  await prisma.siteSettings.upsert({
    where:  { key: SETTINGS_KEY },
    update: { value: body },
    create: { key: SETTINGS_KEY, value: body },
  });
  return NextResponse.json({ ok: true });
}
