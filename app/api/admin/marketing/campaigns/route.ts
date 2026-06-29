import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  await requireAuth();

  const campaigns = await prisma.emailCampaign.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, subject: true, template: true, status: true,
      segments: true, scheduledAt: true, sentAt: true,
      recipientCount: true, openCount: true, clickCount: true, createdAt: true,
    },
  });

  return NextResponse.json({
    campaigns: campaigns.map((c) => ({
      ...c,
      scheduledAt: c.scheduledAt?.toISOString() ?? null,
      sentAt:      c.sentAt?.toISOString()      ?? null,
      createdAt:   c.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  await requireAuth();
  const body = await req.json() as {
    title: string; subject: string; template: string;
    content: Record<string, unknown>; segments: string[];
  };

  const campaign = await prisma.emailCampaign.create({
    data: {
      title:    body.title,
      subject:  body.subject,
      template: body.template,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content:  body.content as any,
      segments: body.segments,
    },
  });

  return NextResponse.json({ id: campaign.id });
}
