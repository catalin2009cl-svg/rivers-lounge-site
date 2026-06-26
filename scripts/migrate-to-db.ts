import path from 'path';
import fs from 'fs';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DATA_DIR = path.join(process.cwd(), 'lib', 'data');

function readJSON<T>(filename: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

async function migrate() {
  console.log('Starting migration to Neon PostgreSQL...\n');

  // ── Users ──────────────────────────────────────────────────────────────
  const { users = [] } = readJSON<{ users: any[] }>('users.json', { users: [] });
  console.log(`Migrating ${users.length} users...`);
  for (const u of users) {
    const clientCode = u.clientCode ?? `RL-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        email: u.email,
        name: u.name,
        phone: u.phone ?? null,
        passwordHash: u.passwordHash ?? u.password ?? '',
        clientCode,
        avatar: u.avatar ?? null,
        birthday: u.birthday ?? null,
        isActive: u.isActive ?? true,
        isVerified: u.isVerified ?? false,
        verifiedAt: u.verifiedAt ? new Date(u.verifiedAt) : null,
        verifiedBy: u.verifiedBy ?? null,
        totalOrders: u.totalOrders ?? 0,
        totalSpent: u.totalSpent ?? 0,
        lastActivityAt: u.lastActivityAt ? new Date(u.lastActivityAt) : null,
        lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt) : null,
        lastOrderAt: u.lastOrderAt ? new Date(u.lastOrderAt) : null,
        adminNote: u.adminNote ?? null,
        retentionNotifiedAt: u.retentionNotifiedAt ? new Date(u.retentionNotifiedAt) : null,
        role: u.role ?? 'client',
        createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
      },
    });
  }
  console.log(`✅ ${users.length} users migrated\n`);

  // ── Orders ─────────────────────────────────────────────────────────────
  const { orders = [] } = readJSON<{ orders: any[] }>('orders.json', { orders: [] });
  console.log(`Migrating ${orders.length} orders...`);
  for (const o of orders) {
    await prisma.order.upsert({
      where: { id: o.id },
      update: {},
      create: {
        id: o.id,
        userId: o.userId ?? null,
        userEmail: o.userEmail ?? null,
        name: o.name ?? '',
        phone: o.phone ?? '',
        orderType: o.orderType ?? 'livrare',
        status: o.status ?? 'noua',
        paymentMethod: o.paymentMethod ?? 'cash',
        paymentStatus: o.paymentStatus ?? 'pending',
        items: o.items ?? [],
        subtotal: o.subtotal ?? 0,
        deliveryFee: o.deliveryFee ?? 0,
        discountAmount: o.discountAmount ?? 0,
        discountCode: o.discountCode ?? null,
        total: o.total ?? 0,
        address: o.address ?? null,
        addressDetails: o.addressDetails ?? null,
        city: o.city ?? null,
        notes: o.notes ?? null,
        observation: o.observation ?? null,
        userLat: o.userLat ?? null,
        userLng: o.userLng ?? null,
        freeCode: o.freeCode ?? null,
        discountApplied: o.discountApplied ?? null,
        processedBy: o.processedBy ?? null,
        createdAt: o.createdAt ? new Date(o.createdAt) : new Date(),
        updatedAt: o.updatedAt ? new Date(o.updatedAt) : new Date(),
      },
    });
  }
  console.log(`✅ ${orders.length} orders migrated\n`);

  // ── Reservations ───────────────────────────────────────────────────────
  const { reservations = [] } = readJSON<{ reservations: any[] }>('reservations.json', { reservations: [] });
  console.log(`Migrating ${reservations.length} reservations...`);
  for (const r of reservations) {
    await prisma.reservation.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        userId: r.userId ?? null,
        name: r.name ?? '',
        email: r.email ?? '',
        phone: r.phone ?? '',
        location: r.location ?? 'Restaurant',
        date: r.date ?? '',
        time: r.time ?? '',
        guests: r.guests ?? 2,
        eventType: r.eventType || null,
        notes: r.notes || null,
        status: r.status ?? 'noua',
        observation: r.observation ?? null,
        adminNote: r.adminNote ?? null,
        notifications: r.notifications ?? [],
        processedBy: r.processedBy ?? null,
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
      },
    });
  }
  console.log(`✅ ${reservations.length} reservations migrated\n`);

  // ── Reviews ────────────────────────────────────────────────────────────
  const { reviews = [] } = readJSON<{ reviews: any[] }>('reviews.json', { reviews: [] });
  console.log(`Migrating ${reviews.length} reviews...`);
  await prisma.review.deleteMany({});
  for (const rv of reviews) {
    await prisma.review.create({
      data: {
        name: rv.name ?? '',
        rating: rv.rating ?? 5,
        text: rv.text ?? '',
        date: rv.date ?? null,
        source: rv.source ?? 'manual',
        approved: rv.approved ?? true,
        featured: rv.featured ?? false,
      },
    });
  }
  console.log(`✅ ${reviews.length} reviews migrated\n`);

  // ── GDPR Requests ──────────────────────────────────────────────────────
  const { requests = [] } = readJSON<{ requests: any[] }>('gdpr-requests.json', { requests: [] });
  console.log(`Migrating ${requests.length} GDPR requests...`);
  for (const req of requests) {
    await prisma.gdprRequest.upsert({
      where: { id: req.id },
      update: {},
      create: {
        id: req.id,
        receivedAt: req.receivedAt ? new Date(req.receivedAt) : new Date(),
        deadline: req.deadline ? new Date(req.deadline) : null,
        requesterEmail: req.requesterEmail ?? '',
        requesterName: req.requesterName ?? '',
        type: req.type ?? 'delete',
        status: req.status ?? 'pending',
        notes: req.notes ?? null,
        processedAt: req.processedAt ? new Date(req.processedAt) : null,
        relatedUserId: req.relatedUserId ?? null,
      },
    });
  }
  console.log(`✅ ${requests.length} GDPR requests migrated\n`);

  // ── Settings ───────────────────────────────────────────────────────────
  console.log('Migrating site settings...');
  const settings = readJSON<Record<string, unknown>>('settings.json', {});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.siteSettings.upsert({
    where: { key: 'main' },
    update: { value: settings as any },
    create: { key: 'main', value: settings as any },
  });
  console.log('✅ Settings migrated\n');

  console.log('🎉 Migration complete!');
  await prisma.$disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
