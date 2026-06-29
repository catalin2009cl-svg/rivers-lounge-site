import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const SEED_DATA = [
  {
    slug: 'weekend-relax',
    name: 'Weekend Relaxare',
    description: 'Evadare de 2 nopți în natură, ideală pentru familii sau grupuri mici.',
    priceFrom: 800,
    duration: '2 nopți',
    includes: ['Cazare 12 persoane', 'Grătar inclus', 'Lemne de foc', 'WiFi & parcare'],
    idealFor: ['Familii', 'Grupuri de prieteni', 'Escapade romantice'],
    order: 0,
  },
  {
    slug: 'private-party',
    name: 'Petrecere Privată',
    description: 'Pachet complet pentru petreceri tematice, aniversări sau seri speciale la cabană.',
    priceFrom: 1500,
    duration: '1 zi / noapte',
    includes: ['Decor tematic', 'Meniu catering', 'Sonorizare', 'Organizator dedicat'],
    idealFor: ['Aniversări', 'Petreceri tematice', 'Seri între prieteni'],
    order: 1,
  },
  {
    slug: 'corporate-retreat',
    name: 'Team Building Corporate',
    description: 'Program complet pentru echipe — activități outdoor, masă și cazare.',
    priceFrom: 2000,
    duration: '1-2 zile',
    includes: ['Activități outdoor', 'Mese complete', 'Sala de conferințe', 'Facilitator'],
    idealFor: ['Echipe corporate', 'Workshop-uri', 'Retreat-uri'],
    order: 2,
  },
  {
    slug: 'special-event',
    name: 'Eveniment Special',
    description: 'Pachet personalizat pentru evenimente unice — botezuri, logodne, reuniuni de familie.',
    priceFrom: 1200,
    duration: 'Personalizat',
    includes: ['Planificare dedicată', 'Meniu la alegere', 'Decor personalizat', 'Fotograf recomandat'],
    idealFor: ['Botezuri', 'Logodne', 'Reuniuni de familie'],
    order: 3,
  },
];

export async function POST() {
  await requireAuth();

  const existing = await prisma.cabinPackage.count();
  if (existing > 0) {
    return NextResponse.json({ message: 'Already seeded', count: existing });
  }

  await prisma.cabinPackage.createMany({ data: SEED_DATA });

  return NextResponse.json({ ok: true, inserted: SEED_DATA.length });
}
