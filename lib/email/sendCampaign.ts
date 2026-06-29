import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { renderTemplate } from '@/lib/email/templates';
import { getRecipientsForSegments } from '@/lib/email/segments';
import type { Segment } from '@/lib/email/segments';
import type { TemplateType, TemplateContent } from '@/lib/email/templates';

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not set');
  return new Resend(process.env.RESEND_API_KEY);
}

const BATCH = 50;
const DELAY_MS = 100;

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export async function sendCampaign(campaignId: string): Promise<void> {
  const campaign = await prisma.emailCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new Error('Campaign not found');
  if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
    throw new Error(`Cannot send campaign with status ${campaign.status}`);
  }

  await prisma.emailCampaign.update({ where: { id: campaignId }, data: { status: 'SENDING' } });

  try {
    const recipients = await getRecipientsForSegments(campaign.segments as Segment[]);
    const resend     = getResend();
    let   sentCount  = 0;

    for (let i = 0; i < recipients.length; i += BATCH) {
      const batch = recipients.slice(i, i + BATCH);

      // Create logs first to get tracking IDs
      const logs = await prisma.$transaction(
        batch.map((r) =>
          prisma.emailLog.create({
            data: { campaignId, userId: r.id, email: r.email },
          })
        )
      );

      const emails = batch.map((r, idx) => ({
        from: 'Rivers Lounge <no_reply@riverslounge.ro>',
        to: r.email,
        subject: campaign.subject,
        html: renderTemplate(
          campaign.template as TemplateType,
          campaign.content as unknown as TemplateContent,
          logs[idx].trackingId,
          r.name
        ),
      }));

      try {
        await resend.batch.send(emails);
        sentCount += batch.length;
      } catch (err) {
        console.error(`[sendCampaign] batch ${i / BATCH + 1} failed:`, err);
      }

      if (i + BATCH < recipients.length) await sleep(DELAY_MS);
    }

    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { status: 'SENT', sentAt: new Date(), recipientCount: sentCount },
    });
  } catch (err) {
    await prisma.emailCampaign.update({ where: { id: campaignId }, data: { status: 'DRAFT' } });
    throw err;
  }
}
