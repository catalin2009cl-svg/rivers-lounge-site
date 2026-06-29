import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  await requireAuth();
  const packages = await prisma.cabinPackage.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });
  return NextResponse.json(packages);
}

export async function POST(req: NextRequest) {
  await requireAuth();
  const body = await req.json();

  const pkg = await prisma.cabinPackage.create({
    data: {
      slug:        body.slug,
      name:        body.name,
      description: body.description,
      priceFrom:   Number(body.priceFrom),
      duration:    body.duration,
      includes:    body.includes ?? [],
      idealFor:    body.idealFor ?? [],
      imageUrl:    body.imageUrl || null,
      isActive:    body.isActive ?? true,
      order:       Number(body.order ?? 0),
    },
  });

  return NextResponse.json(pkg, { status: 201 });
}
