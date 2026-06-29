import { prisma } from '@/lib/prisma';

export type Segment = 'all' | 'level1' | 'level2plus' | 'level3plus' | 'inactive30' | 'inactive60' | 'newLast30';

export interface Recipient {
  id: string;
  email: string;
  name: string;
}

const BASE = { marketingConsent: true, unsubscribedAt: null } as const;
const SEL  = { id: true, email: true, name: true } as const;

export async function getRecipientsForSegments(segments: Segment[]): Promise<Recipient[]> {
  const seen  = new Set<string>();
  const result: Recipient[] = [];
  const now   = new Date();

  function add(rows: Recipient[]) {
    for (const r of rows) {
      if (!seen.has(r.id)) { seen.add(r.id); result.push(r); }
    }
  }

  for (const seg of segments) {
    switch (seg) {
      case 'all':
        add(await prisma.user.findMany({ where: BASE, select: SEL }));
        break;

      case 'level1':
        add(await prisma.user.findMany({
          where: { ...BASE, loyaltyProfile: { currentLevel: 1 } },
          select: SEL,
        }));
        break;

      case 'level2plus':
        add(await prisma.user.findMany({
          where: { ...BASE, loyaltyProfile: { currentLevel: { gte: 2 } } },
          select: SEL,
        }));
        break;

      case 'level3plus':
        add(await prisma.user.findMany({
          where: { ...BASE, loyaltyProfile: { currentLevel: { gte: 3 } } },
          select: SEL,
        }));
        break;

      case 'inactive30': {
        const cutoff = new Date(now.getTime() - 30 * 86_400_000);
        add(await prisma.user.findMany({
          where: { ...BASE, OR: [{ lastOrderAt: null }, { lastOrderAt: { lt: cutoff } }] },
          select: SEL,
        }));
        break;
      }

      case 'inactive60': {
        const cutoff = new Date(now.getTime() - 60 * 86_400_000);
        add(await prisma.user.findMany({
          where: { ...BASE, OR: [{ lastOrderAt: null }, { lastOrderAt: { lt: cutoff } }] },
          select: SEL,
        }));
        break;
      }

      case 'newLast30': {
        const cutoff = new Date(now.getTime() - 30 * 86_400_000);
        add(await prisma.user.findMany({
          where: { ...BASE, createdAt: { gte: cutoff } },
          select: SEL,
        }));
        break;
      }
    }
  }

  return result;
}
