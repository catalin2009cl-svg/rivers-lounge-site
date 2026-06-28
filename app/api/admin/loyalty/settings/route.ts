import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getLoyaltyConfig, saveLoyaltyConfig } from '@/lib/loyalty/config';
import type { LoyaltyConfig } from '@/lib/loyalty/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  await requireAuth();
  const config = await getLoyaltyConfig();
  return NextResponse.json({ config });
}

export async function PUT(req: NextRequest) {
  const session = await requireAuth();
  if (session.role !== 'admin' && session.role !== 'manager') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  const body = await req.json() as LoyaltyConfig;
  await saveLoyaltyConfig(body);
  return NextResponse.json({ success: true });
}
