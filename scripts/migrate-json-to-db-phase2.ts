import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();
const DATA_DIR = path.join(process.cwd(), 'lib', 'data');

async function readJSON<T>(filename: string, defaultValue: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, filename), 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

async function migrateMenu() {
  console.log('Migrating menu...');
  const data = await readJSON<{ items: Record<string, unknown>[] }>('menu.json', { items: [] });
  const items = data.items ?? [];

  const categoryNames: Record<string, string> = { food: 'Mâncare', drinks: 'Băuturi', desserts: 'Deserturi' };
  const categoryOrder = ['food', 'drinks', 'desserts'];
  const categorySet = new Set<string>(items.map((i) => i.category as string));

  for (const slug of categorySet) {
    await prisma.menuCategory.upsert({
      where: { slug },
      create: { slug, name: categoryNames[slug] ?? slug, order: categoryOrder.indexOf(slug) },
      update: {},
    });
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i] as {
      id: string; name: string; description?: string; price: number; unit?: string;
      category: string; subcategory?: string; image?: string; popular?: boolean;
      available?: boolean; status?: string;
    };
    const status = item.status ?? (item.available !== false ? 'disponibil' : 'indisponibil');
    await prisma.menuItem.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        categoryId: item.category,
        subcategory: item.subcategory ?? null,
        name: item.name,
        description: item.description ?? null,
        price: item.price,
        unit: item.unit ?? null,
        image: item.image ?? null,
        status,
        featured: item.popular ?? false,
        order: i,
      },
      update: {
        categoryId: item.category,
        subcategory: item.subcategory ?? null,
        name: item.name,
        description: item.description ?? null,
        price: item.price,
        unit: item.unit ?? null,
        image: item.image ?? null,
        status,
        featured: item.popular ?? false,
        order: i,
      },
    });
  }

  console.log(`  ✓ ${items.length} menu items migrated`);
}

async function migrateNews() {
  console.log('Migrating news posts...');
  const data = await readJSON<{ posts: Record<string, unknown>[] }>('news.json', { posts: [] });
  const posts = data.posts ?? [];

  for (const post of posts) {
    const p = post as {
      id: string; title: string; slug: string; date?: string; image?: string;
      excerpt?: string; content?: string; category?: string; status?: string; publishAt?: string;
    };
    const publishedAt =
      p.status === 'published' && p.date ? new Date(p.date) : null;

    try {
      await prisma.newsArticle.upsert({
        where: { id: p.id },
        create: {
          id: p.id,
          title: p.title,
          slug: p.slug,
          date: p.date ?? null,
          excerpt: p.excerpt ?? null,
          content: p.content ?? '',
          image: p.image ?? null,
          category: p.category ?? 'events',
          status: p.status ?? 'draft',
          publishAt: p.publishAt ?? null,
          publishedAt,
        },
        update: {
          title: p.title,
          slug: p.slug,
          date: p.date ?? null,
          excerpt: p.excerpt ?? null,
          content: p.content ?? '',
          image: p.image ?? null,
          category: p.category ?? 'events',
          status: p.status ?? 'draft',
          publishAt: p.publishAt ?? null,
          publishedAt,
        },
      });
    } catch (e) {
      console.warn(`  ! Skipped news post "${p.slug}" (${(e as Error).message})`);
    }
  }

  console.log(`  ✓ ${posts.length} news posts migrated`);
}

async function migrateEvents() {
  console.log('Migrating special events...');
  const data = await readJSON<{ events: Record<string, unknown>[] }>('events.json', { events: [] });
  const events = data.events ?? [];

  for (const event of events) {
    const e = event as {
      id: string; title: string; description?: string; date?: string; time?: string;
      location?: string; image?: string; ctaLabel?: string; ctaUrl?: string; status?: string;
    };
    await prisma.specialEvent.upsert({
      where: { id: e.id },
      create: {
        id: e.id,
        title: e.title,
        description: e.description ?? null,
        date: e.date ?? null,
        time: e.time ?? null,
        location: e.location ?? null,
        image: e.image ?? null,
        ctaLabel: e.ctaLabel ?? null,
        ctaUrl: e.ctaUrl ?? null,
        status: e.status ?? 'active',
      },
      update: {
        title: e.title,
        description: e.description ?? null,
        date: e.date ?? null,
        time: e.time ?? null,
        location: e.location ?? null,
        image: e.image ?? null,
        ctaLabel: e.ctaLabel ?? null,
        ctaUrl: e.ctaUrl ?? null,
        status: e.status ?? 'active',
      },
    });
  }

  console.log(`  ✓ ${events.length} events migrated`);
}

async function migrateOperators() {
  console.log('Migrating operators...');
  const data = await readJSON<{ operators: Record<string, unknown>[] }>('operators.json', { operators: [] });
  const operators = data.operators ?? [];

  for (const op of operators) {
    const o = op as {
      id: string; name: string; username: string; role?: string; passwordHash: string;
      pin?: string; isActive?: boolean; totalOrdersProcessed?: number;
      totalReservationsProcessed?: number; loginHistory?: unknown; activityLog?: unknown;
      createdAt?: string; lastLoginAt?: string; lastActivityAt?: string;
    };

    try {
      await prisma.operator.upsert({
        where: { id: o.id },
        create: {
          id: o.id,
          name: o.name,
          username: o.username,
          role: o.role ?? 'operator',
          passwordHash: o.passwordHash,
          pin: o.pin ?? null,
          isActive: o.isActive ?? true,
          totalOrdersProcessed: o.totalOrdersProcessed ?? 0,
          totalReservationsProcessed: o.totalReservationsProcessed ?? 0,
          loginHistory: (o.loginHistory ?? []) as never,
          activityLog: (o.activityLog ?? []) as never,
          createdAt: o.createdAt ? new Date(o.createdAt) : new Date(),
          lastLoginAt: o.lastLoginAt ? new Date(o.lastLoginAt) : null,
          lastActivityAt: o.lastActivityAt && o.lastActivityAt !== '' ? new Date(o.lastActivityAt) : null,
        },
        update: {
          name: o.name,
          username: o.username,
          role: o.role ?? 'operator',
          passwordHash: o.passwordHash,
          pin: o.pin ?? null,
          isActive: o.isActive ?? true,
          totalOrdersProcessed: o.totalOrdersProcessed ?? 0,
          totalReservationsProcessed: o.totalReservationsProcessed ?? 0,
          loginHistory: (o.loginHistory ?? []) as never,
          activityLog: (o.activityLog ?? []) as never,
          lastLoginAt: o.lastLoginAt ? new Date(o.lastLoginAt) : null,
          lastActivityAt: o.lastActivityAt && o.lastActivityAt !== '' ? new Date(o.lastActivityAt) : null,
        },
      });
    } catch (e) {
      console.warn(`  ! Skipped operator "${o.username}" (${(e as Error).message})`);
    }
  }

  console.log(`  ✓ ${operators.length} operators migrated`);
}

async function migrateGalleries() {
  console.log('Migrating galleries...');

  const galleries: Array<[string, string]> = [
    ['gallery-cabana', 'cabana-gallery.json'],
    ['gallery-rivers-land', 'rivers-land-gallery.json'],
    ['gallery-rivers-marina', 'rivers-marina-gallery.json'],
  ];

  for (const [key, file] of galleries) {
    const data = await readJSON<{ photos: unknown[] }>( file, { photos: [] });
    const photos = data.photos ?? [];
    await prisma.siteSettings.upsert({
      where: { key },
      create: { key, value: photos as never },
      update: { value: photos as never },
    });
    console.log(`  ✓ ${key}: ${photos.length} photos`);
  }
}

async function migrateSocial() {
  console.log('Migrating social settings...');
  const social = await readJSON('social.json', {
    showFacebook: false,
    facebookVideos: [],
    showTiktok: false,
    tiktokVideos: [],
  });

  await prisma.siteSettings.upsert({
    where: { key: 'social' },
    create: { key: 'social', value: social as never },
    update: { value: social as never },
  });

  console.log('  ✓ Social settings migrated');
}

async function main() {
  console.log('Starting phase 2 migration: JSON → PostgreSQL\n');
  try {
    await migrateMenu();
    await migrateNews();
    await migrateEvents();
    await migrateOperators();
    await migrateGalleries();
    await migrateSocial();
    console.log('\n✅ Migration complete!');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
