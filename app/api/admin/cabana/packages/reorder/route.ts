import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Body: { ids: string[] }  — ordered list of package IDs
export async function PUT(req: NextRequest) {
  await requireAuth();
  const { ids } = await req.json() as { ids: string[] };

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.cabinPackage.update({ where: { id }, data: { order: index } })
    )
  );

  return NextResponse.json({ ok: true });
}
