import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { renderTemplate } from '@/lib/email/templates';
import type { TemplateType, TemplateContent } from '@/lib/email/templates';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAuth();
  const { id } = await params;

  const campaign = await prisma.emailCampaign.findUnique({ where: { id } });
  if (!campaign) return new NextResponse('Not found', { status: 404 });

  const html = renderTemplate(
    campaign.template as TemplateType,
    campaign.content as unknown as TemplateContent,
    'preview-000',
    'Destinatar Preview'
  );

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html;charset=utf-8' },
  });
}
