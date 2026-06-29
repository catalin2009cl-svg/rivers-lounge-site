import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAuth();
  const { id } = await params;
  const body = await req.json() as {
    title?: string; subject?: string; template?: string;
    content?: Record<string, unknown>; segments?: string[];
  };

  const campaign = await prisma.emailCampaign.update({
    where: { id },
    data: {
      ...(body.title    != null && { title:    body.title }),
      ...(body.subject  != null && { subject:  body.subject }),
      ...(body.template != null && { template: body.template }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(body.content  != null && { content:  body.content as any }),
      ...(body.segments != null && { segments: body.segments }),
    },
  });

  return NextResponse.json({ id: campaign.id });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAuth();
  const { id } = await params;

  const campaign = await prisma.emailCampaign.findUnique({ where: { id } });
  if (!campaign || campaign.status !== 'DRAFT') {
    return NextResponse.json({ error: 'Solo campaniile DRAFT pot fi șterse.' }, { status: 400 });
  }

  await prisma.emailLog.deleteMany({ where: { campaignId: id } });
  await prisma.emailCampaign.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
