import fs from 'fs/promises';
import path from 'path';
import { prisma } from './prisma';

export interface MenuProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  category: 'food' | 'drinks' | 'desserts';
  subcategory: string;
  image: string;
  popular: boolean;
  available: boolean;
  status?: 'disponibil' | 'indisponibil' | 'retras' | 'draft';
}

export interface NewsPost {
  id: string;
  title: string;
  slug: string;
  date: string;
  image: string;
  excerpt: string;
  content: string;
  category: 'events' | 'daily-menu' | 'promotions';
  status: 'published' | 'draft' | 'scheduled';
  publishAt?: string;
}

export interface SpecialEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  image: string;
  ctaLabel: string;
  ctaUrl: string;
  location: 'Restaurant' | 'Cabana Rivers' | "River's Land" | "River's Marina" | 'Toate locațiile';
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  date: string;
  source: 'google' | 'manual' | 'other';
  approved: boolean;
  featured: boolean;
}

export interface FacebookVideo {
  id: string;
  url: string;
}

export interface SocialSettings {
  showFacebook: boolean;
  facebookVideos: FacebookVideo[];
  showTiktok: boolean;
  tiktokVideos: { id: string; url: string }[];
}

const DATA_DIR = path.join(process.cwd(), 'lib', 'data');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

async function readJSON<T>(filename: string, defaultValue: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, filename), 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

async function writeJSON<T>(filename: string, data: T): Promise<void> {
  await fs.writeFile(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf-8');
}

export async function getMenuItems(): Promise<MenuProduct[]> {
  const data = await readJSON<{ items: MenuProduct[] }>('menu.json', { items: [] });
  return data.items.map((item) => {
    const status = item.status ?? (item.available ? 'disponibil' : 'indisponibil');
    return { ...item, status, available: status === 'disponibil' };
  });
}

export async function saveMenuItems(items: MenuProduct[]): Promise<void> {
  await writeJSON('menu.json', { items });
}

export async function getNewsPosts(): Promise<NewsPost[]> {
  const data = await readJSON<{ posts: NewsPost[] }>('news.json', { posts: [] });
  return data.posts;
}

export async function saveNewsPosts(posts: NewsPost[]): Promise<void> {
  await writeJSON('news.json', { posts });
}

export async function getSpecialEvents(): Promise<SpecialEvent[]> {
  const data = await readJSON<{ events: SpecialEvent[] }>('events.json', { events: [] });
  return data.events;
}

export async function saveSpecialEvents(events: SpecialEvent[]): Promise<void> {
  await writeJSON('events.json', { events });
}

export async function getSocialSettings(): Promise<SocialSettings> {
  return readJSON<SocialSettings>('social.json', {
    showFacebook: false,
    facebookVideos: [],
    showTiktok: false,
    tiktokVideos: [],
  });
}

export async function saveSocialSettings(settings: SocialSettings): Promise<void> {
  await writeJSON('social.json', settings);
}

// ── Reviews — DB-backed ─────────────────────────────────────────────────────

export async function getReviews(): Promise<Review[]> {
  const rows = await prisma.review.findMany({ orderBy: { createdAt: 'desc' } });
  return rows.map((rv) => ({
    id: rv.id,
    name: rv.name,
    rating: rv.rating,
    text: rv.text,
    date: rv.date ?? '',
    source: (rv.source ?? 'manual') as Review['source'],
    approved: rv.approved,
    featured: rv.featured,
  }));
}

export async function saveReviews(reviews: Review[]): Promise<void> {
  const ids = reviews.map((r) => r.id);
  await prisma.review.deleteMany({
    where: ids.length > 0 ? { id: { notIn: ids } } : {},
  });
  for (const rv of reviews) {
    await prisma.review.upsert({
      where: { id: rv.id },
      create: {
        id: rv.id,
        name: rv.name,
        rating: rv.rating,
        text: rv.text,
        date: rv.date || null,
        source: rv.source ?? 'manual',
        approved: rv.approved ?? false,
        featured: rv.featured ?? false,
      },
      update: {
        name: rv.name,
        rating: rv.rating,
        text: rv.text,
        date: rv.date || null,
        source: rv.source ?? 'manual',
        approved: rv.approved ?? false,
        featured: rv.featured ?? false,
      },
    });
  }
}

export async function listUploadedImages(): Promise<string[]> {
  try {
    const files = await fs.readdir(UPLOADS_DIR);
    return files
      .filter((f) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
      .sort((a, b) => b.localeCompare(a))
      .map((f) => `/uploads/${f}`);
  } catch {
    return [];
  }
}

export function getPublishedPosts(posts: NewsPost[]): NewsPost[] {
  const now = new Date();
  return posts.filter((p) => {
    if (p.status === 'published') return true;
    if (p.status === 'scheduled' && p.publishAt && new Date(p.publishAt) <= now) return true;
    return false;
  });
}

export function getUpcomingEvents(events: SpecialEvent[]): SpecialEvent[] {
  const now = new Date();
  return events
    .filter((e) => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export type DailyMenuType = 'meniu-zilei' | 'mic-dejun';

export interface DailyMenuScheduleDay {
  type: DailyMenuType;
  title: string;
  description: string;
  price: number;
}

export interface DailyMenuSchedule {
  enabled: boolean;
  monday: DailyMenuScheduleDay;
  tuesday: DailyMenuScheduleDay;
  wednesday: DailyMenuScheduleDay;
  thursday: DailyMenuScheduleDay;
  friday: DailyMenuScheduleDay;
  saturday: DailyMenuScheduleDay;
  sunday: DailyMenuScheduleDay;
}

export interface DailyMenuConfig {
  enabled: boolean;
  type: DailyMenuType;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  oldPrice: number;
  image: string;
  validUntil: string;
  showAsBanner: boolean;
  showAsPopup: boolean;
  ctaLabel: string;
  ctaUrl: string;
  schedule: DailyMenuSchedule;
}

export interface DailyMenuBannerData {
  type: DailyMenuType;
  title: string;
  description: string;
  price: number;
  oldPrice?: number;
  image?: string;
  validUntil?: string;
  ctaLabel: string;
  ctaUrl: string;
  showAsBanner: boolean;
  showAsPopup: boolean;
}

export interface GpsTier {
  fromKm: number;
  toKm: number;
  fee: number;
  minOrder: number;
}

export interface DeliveryConfig {
  restaurantLat: number;
  restaurantLng: number;
  maxRadiusKm: number;
  gpsTiers: GpsTier[];
}

export interface HeroImages {
  acasa: string;
  restaurant: string;
  meniu: string;
  rezervari: string;
  cabana: string;
  noutati: string;
  contact: string;
  cabanaFeature: string;
  riversLand: string;
  riversMarina: string;
  riversMarinaFeature: string;
}

export interface PopupConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  description: string;
  type: 'promo' | 'event' | 'seasonal' | 'announcement';
  badgeText: string;
  ctaLabel: string;
  ctaUrl: string;
  ctaSecondaryLabel: string;
  ctaSecondaryUrl: string;
  image: string;
  backgroundColor: string;
  accentColor: string;
  showOnce: boolean;
  showDelay: number;
  showAfterPages: number;
  expiresAt: string;
  createdAt: string;
}

export interface BrandingConfig {
  logoLight: string;
  logoDark: string;
  favicon: string;
  ogImage: string;
  logoWidth: number;
  logoHeight: number;
}

export interface SiteSettings {
  heroImage: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImages: HeroImages;
  hours: string;
  phone: string;
  email: string;
  address: string;
  addressCabana: string;
  delivery?: DeliveryConfig;
  popup?: PopupConfig;
  branding?: BrandingConfig;
  dailyMenu?: DailyMenuConfig;
}

const DEFAULT_HERO_IMAGES: HeroImages = {
  acasa: '',
  restaurant: '',
  meniu: '',
  rezervari: '',
  cabana: '',
  noutati: '',
  contact: '',
  cabanaFeature: '',
  riversLand: '',
  riversMarina: '',
  riversMarinaFeature: '',
};

const DEFAULT_SETTINGS: SiteSettings = {
  heroImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&h=1080&fit=crop',
  heroTitle: 'Restaurant, Evenimente & Relaxare în Călărași',
  heroSubtitle: '',
  heroImages: DEFAULT_HERO_IMAGES,
  hours: 'Luni – Duminică: 07:30 – 00:00',
  phone: '0734 642 449',
  email: 'contact@riverslounge.ro',
  address: 'Strada Principală nr. 123, Călărași, România',
  addressCabana: '',
};

// ── Settings — DB-backed ────────────────────────────────────────────────────

export async function getSettings(): Promise<SiteSettings> {
  const row = await prisma.siteSettings.findUnique({ where: { key: 'main' } });
  if (!row) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...(row.value as unknown as SiteSettings) };
}

export async function saveSettings(settings: SiteSettings): Promise<void> {
  await prisma.siteSettings.upsert({
    where: { key: 'main' },
    update: { value: settings as never },
    create: { key: 'main', value: settings as never },
  });
}

export interface CabanaPhoto {
  id: string;
  src: string;
  caption: string;
  order: number;
}

export async function getCabanaGallery(): Promise<CabanaPhoto[]> {
  const data = await readJSON<{ photos: CabanaPhoto[] }>('cabana-gallery.json', { photos: [] });
  return (data.photos ?? []).sort((a, b) => a.order - b.order);
}

export async function saveCabanaGallery(photos: CabanaPhoto[]): Promise<void> {
  await writeJSON('cabana-gallery.json', { photos });
}

export interface ReservationNotification {
  id: string;
  message: string;
  oldStatus: string;
  newStatus: string;
  createdAt: string;
  isRead: boolean;
  adminNote?: string;
}

export interface Reservation {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  guests: number;
  location: string;
  eventType: string;
  notes: string;
  status: 'noua' | 'acceptata' | 'refuzata' | 'in-asteptare';
  observation: string;
  updatedAt: string;
  notifications?: ReservationNotification[];
  processedBy?: {
    operatorId: string;
    operatorName: string;
    action: string;
    timestamp: string;
  }[];
}

// ── Reservations — DB-backed ────────────────────────────────────────────────

function mapDbToReservation(row: {
  id: string; createdAt: Date; updatedAt: Date; name: string; phone: string;
  email: string; date: string; time: string; guests: number; location: string;
  eventType: string | null; notes: string | null; status: string;
  observation: string | null; notifications: unknown; processedBy: unknown;
}): Reservation {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    name: row.name,
    phone: row.phone,
    email: row.email,
    date: row.date,
    time: row.time,
    guests: row.guests,
    location: row.location,
    eventType: row.eventType ?? '',
    notes: row.notes ?? '',
    status: row.status as Reservation['status'],
    observation: row.observation ?? '',
    notifications: (row.notifications as ReservationNotification[]) ?? [],
    processedBy: row.processedBy as Reservation['processedBy'],
  };
}

function mapReservationToDb(r: Reservation) {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    location: r.location,
    date: r.date,
    time: r.time,
    guests: r.guests,
    eventType: r.eventType || null,
    notes: r.notes || null,
    status: r.status,
    observation: r.observation || null,
    notifications: (r.notifications ?? []) as never,
    processedBy: (r.processedBy ?? null) as never,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  };
}

export async function getReservations(): Promise<Reservation[]> {
  const rows = await prisma.reservation.findMany({ orderBy: { createdAt: 'desc' } });
  return rows.map(mapDbToReservation);
}

export async function saveReservations(reservations: Reservation[]): Promise<void> {
  const ids = reservations.map((r) => r.id);
  if (ids.length === 0) {
    await prisma.reservation.deleteMany({});
    return;
  }
  await prisma.$transaction(async (tx) => {
    await tx.reservation.deleteMany({ where: { id: { notIn: ids } } });
    for (const r of reservations) {
      const data = mapReservationToDb(r);
      await tx.reservation.upsert({
        where: { id: r.id },
        create: data,
        update: data,
      });
    }
  });
}

export interface RiversLandPhoto {
  id: string;
  src: string;
  caption: string;
  order: number;
}

export async function getRiversLandGallery(): Promise<RiversLandPhoto[]> {
  const data = await readJSON<{ photos: RiversLandPhoto[] }>('rivers-land-gallery.json', { photos: [] });
  return (data.photos ?? []).sort((a, b) => a.order - b.order);
}

export async function saveRiversLandGallery(photos: RiversLandPhoto[]): Promise<void> {
  await writeJSON('rivers-land-gallery.json', { photos });
}

export interface RiversMarinaPhoto {
  id: string;
  src: string;
  caption: string;
  order: number;
}

export async function getRiversMarinaGallery(): Promise<RiversMarinaPhoto[]> {
  const data = await readJSON<{ photos: RiversMarinaPhoto[] }>('rivers-marina-gallery.json', { photos: [] });
  return (data.photos ?? []).sort((a, b) => a.order - b.order);
}

export async function saveRiversMarinaGallery(photos: RiversMarinaPhoto[]): Promise<void> {
  await writeJSON('rivers-marina-gallery.json', { photos });
}

export interface User {
  id: string;
  createdAt: string;
  lastLoginAt: string;
  lastActivityAt?: string;
  retentionNotifiedAt?: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  isActive: boolean;
  role: 'client' | 'admin';
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: string;
  adminNote: string;
  isVerified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  avatar?: string;
  birthday?: string;
}

// ── Users — DB-backed ───────────────────────────────────────────────────────

function mapDbToUser(row: {
  id: string; createdAt: Date; lastLoginAt: Date | null; lastActivityAt: Date | null;
  retentionNotifiedAt: Date | null; name: string; email: string; phone: string | null;
  passwordHash: string; isActive: boolean; role: string; totalOrders: number;
  totalSpent: number; lastOrderAt: Date | null; adminNote: string | null;
  isVerified: boolean; verifiedAt: Date | null; verifiedBy: string | null;
  avatar: string | null; birthday: string | null;
}): User {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    lastLoginAt: row.lastLoginAt?.toISOString() ?? '',
    lastActivityAt: row.lastActivityAt?.toISOString(),
    retentionNotifiedAt: row.retentionNotifiedAt?.toISOString(),
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    passwordHash: row.passwordHash,
    isActive: row.isActive,
    role: (row.role ?? 'client') as 'client' | 'admin',
    totalOrders: row.totalOrders,
    totalSpent: row.totalSpent,
    lastOrderAt: row.lastOrderAt?.toISOString(),
    adminNote: row.adminNote ?? '',
    isVerified: row.isVerified,
    verifiedAt: row.verifiedAt?.toISOString(),
    verifiedBy: row.verifiedBy ?? undefined,
    avatar: row.avatar ?? undefined,
    birthday: row.birthday ?? undefined,
  };
}

function mapUserUpdate(u: User) {
  return {
    email: u.email,
    name: u.name,
    phone: u.phone ?? null,
    passwordHash: u.passwordHash,
    avatar: u.avatar ?? null,
    birthday: u.birthday ?? null,
    isActive: u.isActive,
    isVerified: u.isVerified,
    verifiedAt: u.verifiedAt ? new Date(u.verifiedAt) : null,
    verifiedBy: u.verifiedBy ?? null,
    totalOrders: u.totalOrders,
    totalSpent: u.totalSpent,
    lastActivityAt: u.lastActivityAt ? new Date(u.lastActivityAt) : null,
    lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt) : null,
    lastOrderAt: u.lastOrderAt ? new Date(u.lastOrderAt) : null,
    adminNote: u.adminNote ?? null,
    retentionNotifiedAt: u.retentionNotifiedAt ? new Date(u.retentionNotifiedAt) : null,
    role: u.role ?? 'client',
  };
}

function mapUserCreate(u: User) {
  return {
    ...mapUserUpdate(u),
    id: u.id,
    clientCode: `RL-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
  };
}

export async function getUsers(): Promise<User[]> {
  const rows = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  return rows.map(mapDbToUser);
}

export async function saveUsers(users: User[]): Promise<void> {
  if (users.length === 0) {
    await prisma.user.deleteMany({});
    return;
  }
  const ids = users.map((u) => u.id);
  await prisma.$transaction(async (tx) => {
    await tx.user.deleteMany({ where: { id: { notIn: ids } } });
    for (const u of users) {
      await tx.user.upsert({
        where: { id: u.id },
        create: mapUserCreate(u),
        update: mapUserUpdate(u),
      });
    }
  });
}

export async function getUserById(id: string): Promise<User | null> {
  const row = await prisma.user.findUnique({ where: { id } });
  return row ? mapDbToUser(row) : null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const row = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });
  return row ? mapDbToUser(row) : null;
}

export interface OperatorActivityLog {
  timestamp: string;
  action: string;
  targetId: string;
  targetType: 'order' | 'reservation';
  details: string;
}

export interface OperatorLoginHistory {
  loginAt: string;
  logoutAt?: string;
}

export interface Operator {
  id: string;
  createdAt: string;
  name: string;
  username: string;
  passwordHash: string;
  pin?: string;
  role: 'manager' | 'operator';
  isActive: boolean;
  totalOrdersProcessed: number;
  totalReservationsProcessed: number;
  lastLoginAt: string;
  lastActivityAt: string;
  loginHistory: OperatorLoginHistory[];
  activityLog: OperatorActivityLog[];
}

export async function getOperators(): Promise<Operator[]> {
  const data = await readJSON<{ operators: Operator[] }>('operators.json', { operators: [] });
  return data.operators ?? [];
}

export async function saveOperators(operators: Operator[]): Promise<void> {
  await writeJSON('operators.json', { operators });
}

export async function getOperatorById(id: string): Promise<Operator | null> {
  const operators = await getOperators();
  return operators.find((op) => op.id === id) ?? null;
}

export async function getOperatorByUsername(username: string): Promise<Operator | null> {
  const operators = await getOperators();
  return operators.find((op) => op.username.toLowerCase() === username.toLowerCase()) ?? null;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  category?: string;
}

export interface Order {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  addressDetails: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: 'cash' | 'card';
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderType: 'livrare' | 'ridicare';
  status: 'noua' | 'confirmata' | 'in-pregatire' | 'livrata' | 'anulata';
  observation: string;
  notes: string;
  userLat?: number;
  userLng?: number;
  userId?: string;
  userEmail?: string;
  freeCode?: string;
  discountApplied?: string;
  discountAmount?: number;
  processedBy?: {
    operatorId: string;
    operatorName: string;
    action: string;
    timestamp: string;
  }[];
}

// ── Orders — DB-backed ──────────────────────────────────────────────────────

function mapDbToOrder(row: {
  id: string; createdAt: Date; updatedAt: Date; name: string; phone: string;
  address: string | null; city: string | null; addressDetails: string | null;
  items: unknown; subtotal: number; deliveryFee: number; total: number;
  paymentMethod: string; paymentStatus: string; orderType: string; status: string;
  observation: string | null; notes: string | null; userLat: number | null;
  userLng: number | null; userId: string | null; userEmail: string | null;
  freeCode: string | null; discountApplied: string | null; discountAmount: number;
  processedBy: unknown;
}): Order {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    name: row.name,
    phone: row.phone,
    address: row.address ?? '',
    city: row.city ?? '',
    addressDetails: row.addressDetails ?? '',
    items: (row.items as OrderItem[]) ?? [],
    subtotal: row.subtotal,
    deliveryFee: row.deliveryFee,
    total: row.total,
    paymentMethod: row.paymentMethod as Order['paymentMethod'],
    paymentStatus: row.paymentStatus as Order['paymentStatus'],
    orderType: row.orderType as Order['orderType'],
    status: row.status as Order['status'],
    observation: row.observation ?? '',
    notes: row.notes ?? '',
    userLat: row.userLat ?? undefined,
    userLng: row.userLng ?? undefined,
    userId: row.userId ?? undefined,
    userEmail: row.userEmail ?? undefined,
    freeCode: row.freeCode ?? undefined,
    discountApplied: row.discountApplied ?? undefined,
    discountAmount: row.discountAmount ?? undefined,
    processedBy: row.processedBy as Order['processedBy'],
  };
}

function mapOrderToDb(o: Order) {
  return {
    id: o.id,
    userId: o.userId ?? null,
    userEmail: o.userEmail ?? null,
    name: o.name,
    phone: o.phone,
    orderType: o.orderType,
    status: o.status,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    items: (o.items ?? []) as never,
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    discountAmount: o.discountAmount ?? 0,
    total: o.total,
    address: o.address || null,
    addressDetails: o.addressDetails || null,
    city: o.city || null,
    notes: o.notes || null,
    observation: o.observation || null,
    userLat: o.userLat ?? null,
    userLng: o.userLng ?? null,
    freeCode: o.freeCode ?? null,
    discountApplied: o.discountApplied ?? null,
    processedBy: (o.processedBy ?? null) as never,
    createdAt: new Date(o.createdAt),
    updatedAt: new Date(o.updatedAt),
  };
}

export async function getOrders(): Promise<Order[]> {
  const rows = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
  return rows.map(mapDbToOrder);
}

export async function saveOrders(orders: Order[]): Promise<void> {
  if (orders.length === 0) {
    await prisma.order.deleteMany({});
    return;
  }
  const ids = orders.map((o) => o.id);
  await prisma.$transaction(async (tx) => {
    await tx.order.deleteMany({ where: { id: { notIn: ids } } });
    for (const o of orders) {
      const data = mapOrderToDb(o);
      await tx.order.upsert({
        where: { id: o.id },
        create: data,
        update: data,
      });
    }
  });
}
