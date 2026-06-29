import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MarketingClient } from './MarketingClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Marketing Email | Admin River's Lounge",
};

export default async function MarketingPage() {
  await requireAuth();

  const [campaigns, subscriberCounts] = await Promise.all([
    prisma.emailCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.user.groupBy({
      by: ['marketingConsent'],
      _count: { _all: true },
    }),
  ]);

  const totalSubscribers  = subscriberCounts.find((r) => r.marketingConsent)?._count._all ?? 0;
  const totalUnsubscribed = (await prisma.user.count({ where: { unsubscribedAt: { not: null } } }));

  const campaignsData = campaigns.map((c) => ({
    id:             c.id,
    title:          c.title,
    subject:        c.subject,
    status:         c.status as string,
    template:       c.template as string,
    segments:       c.segments as string[],
    scheduledAt:    c.scheduledAt?.toISOString()  ?? null,
    sentAt:         c.sentAt?.toISOString()        ?? null,
    recipientCount: c.recipientCount,
    openCount:      c.openCount,
    clickCount:     c.clickCount,
    createdAt:      c.createdAt.toISOString(),
  }));

  return (
    <MarketingClient
      campaigns={campaignsData}
      totalSubscribers={totalSubscribers}
      totalUnsubscribed={totalUnsubscribed}
    />
  );
}
