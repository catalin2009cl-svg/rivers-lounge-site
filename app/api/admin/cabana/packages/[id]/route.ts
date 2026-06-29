import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  const body = await req.json();

  const pkg = await prisma.cabinPackage.update({
    where: { id },
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

  return NextResponse.json(pkg);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  await prisma.cabinPackage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
