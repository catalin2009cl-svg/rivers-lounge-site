import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
  await requireAuth();

  const users = await prisma.user.findMany({
    where: { OR: [{ marketingConsent: true }, { unsubscribedAt: { not: null } }] },
    select: {
      name: true, email: true, marketingConsent: true,
      marketingConsentAt: true, unsubscribedAt: true, lastOrderAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  function csvCell(v: string): string {
    return `"${v.replace(/"/g, '""')}"`;
  }

  const header = ['Nume', 'Email', 'Consimțământ', 'Data consimțământ', 'Dezabonat la', 'Ultima comandă'];
  const rows   = users.map((u) => [
    u.name,
    u.email,
    u.marketingConsent ? 'Da' : 'Nu',
    u.marketingConsentAt?.toISOString() ?? '',
    u.unsubscribedAt?.toISOString()    ?? '',
    u.lastOrderAt?.toISOString()        ?? '',
  ]);

  const csv = '﻿' + [header, ...rows]
    .map((row) => row.map((cell) => csvCell(String(cell))).join(','))
    .join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type':        'text/csv;charset=utf-8',
      'Content-Disposition': `attachment;filename="abonati-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
