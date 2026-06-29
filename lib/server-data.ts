import { list } from '@vercel/blob';
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

// ── Menu — DB-backed ────────────────────────────────────────────────────────

function mapDbToMenuProduct(row: {
  id: string; categoryId: string; subcategory: string | null; name: string;
  description: string | null; price: number; unit: string | null; image: string | null;
  status: string; featured: boolean; order: number;
}): MenuProduct {
  const status = row.status as MenuProduct['status'];
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    price: row.price,
    unit: row.unit ?? '',
    category: row.categoryId as MenuProduct['category'],
    subcategory: row.subcategory ?? '',
    image: row.image ?? '',
    popular: row.featured,
    available: row.status === 'disponibil',
    status,
  };
}

export async function getMenuItems(): Promise<MenuProduct[]> {
  const rows = await prisma.menuItem.findMany({ orderBy: { order: 'asc' } });
  return rows.map(mapDbToMenuProduct);
}

export async function saveMenuItems(items: MenuProduct[]): Promise<void> {
  const ids = items.map((i) => i.id);
  await prisma.$transaction(async (tx) => {
    if (ids.length > 0) {
      await tx.menuItem.deleteMany({ where: { id: { notIn: ids } } });
    } else {
      await tx.menuItem.deleteMany({});
    }
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const status = item.status ?? (item.available ? 'disponibil' : 'indisponibil');
      const data = {
        categoryId: item.category,
        subcategory: item.subcategory || null,
        name: item.name,
        description: item.description || null,
        price: item.price,
        unit: item.unit || null,
        image: item.image || null,
        status,
        featured: item.popular ?? false,
        order: i,
      };
      await tx.menuItem.upsert({ where: { id: item.id }, create: { id: item.id, ...data }, update: data });
    }
  });
}

// ── News — DB-backed ────────────────────────────────────────────────────────

function mapDbToNewsPost(row: {
  id: string; title: string; slug: string; date: string | null; image: string | null;
  excerpt: string | null; content: string; category: string; status: string; publishAt: string | null;
}): NewsPost {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    date: row.date ?? '',
    image: row.image ?? '',
    excerpt: row.excerpt ?? '',
    content: row.content,
    category: row.category as NewsPost['category'],
    status: row.status as NewsPost['status'],
    publishAt: row.publishAt ?? undefined,
  };
}

export async function getNewsPosts(): Promise<NewsPost[]> {
  const rows = await prisma.newsArticle.findMany({ orderBy: { createdAt: 'desc' } });
  return rows.map(mapDbToNewsPost);
}

export async function saveNewsPosts(posts: NewsPost[]): Promise<void> {
  const ids = posts.map((p) => p.id);
  await prisma.$transaction(async (tx) => {
    if (ids.length > 0) {
      await tx.newsArticle.deleteMany({ where: { id: { notIn: ids } } });
    } else {
      await tx.newsArticle.deleteMany({});
    }
    for (const post of posts) {
      const publishedAt =
        post.status === 'published' && post.date ? new Date(post.date) : null;
      const data = {
        title: post.title,
        slug: post.slug,
        date: post.date || null,
        excerpt: post.excerpt || null,
        content: post.content ?? '',
        image: post.image || null,
        category: post.category ?? 'events',
        status: post.status ?? 'draft',
        publishAt: post.publishAt || null,
        publishedAt,
      };
      await tx.newsArticle.upsert({ where: { id: post.id }, create: { id: post.id, ...data }, update: data });
    }
  });
}

// ── Special Events — DB-backed ──────────────────────────────────────────────

function mapDbToSpecialEvent(row: {
  id: string; title: string; description: string | null; date: string | null;
  time: string | null; location: string | null; image: string | null;
  ctaLabel: string | null; ctaUrl: string | null; status: string;
}): SpecialEvent {
  return {
    id: row.id,
    title: row.title,
    date: row.date ?? '',
    time: row.time ?? '',
    description: row.description ?? '',
    image: row.image ?? '',
    ctaLabel: row.ctaLabel ?? '',
    ctaUrl: row.ctaUrl ?? '',
    location: (row.location ?? 'Restaurant') as SpecialEvent['location'],
  };
}

export async function getSpecialEvents(): Promise<SpecialEvent[]> {
  const rows = await prisma.specialEvent.findMany({ orderBy: { createdAt: 'asc' } });
  return rows.map(mapDbToSpecialEvent);
}

export async function saveSpecialEvents(events: SpecialEvent[]): Promise<void> {
  const ids = events.map((e) => e.id);
  await prisma.$transaction(async (tx) => {
    if (ids.length > 0) {
      await tx.specialEvent.deleteMany({ where: { id: { notIn: ids } } });
    } else {
      await tx.specialEvent.deleteMany({});
    }
    for (const event of events) {
      const data = {
        title: event.title,
        description: event.description || null,
        date: event.date || null,
        time: event.time || null,
        location: event.location || null,
        image: event.image || null,
        ctaLabel: event.ctaLabel || null,
        ctaUrl: event.ctaUrl || null,
        status: 'active',
      };
      await tx.specialEvent.upsert({ where: { id: event.id }, create: { id: event.id, ...data }, update: data });
    }
  });
}

// ── Social — DB-backed ──────────────────────────────────────────────────────

const DEFAULT_SOCIAL: SocialSettings = {
  showFacebook: false,
  facebookVideos: [],
  showTiktok: false,
  tiktokVideos: [],
};

export async function getSocialSettings(): Promise<SocialSettings> {
  const row = await prisma.siteSettings.findUnique({ where: { key: 'social' } });
  if (!row) return DEFAULT_SOCIAL;
  return { ...DEFAULT_SOCIAL, ...(row.value as unknown as SocialSettings) };
}

export async function saveSocialSettings(settings: SocialSettings): Promise<void> {
  await prisma.siteSettings.upsert({
    where: { key: 'social' },
    create: { key: 'social', value: settings as never },
    update: { value: settings as never },
  });
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
    const { blobs } = await list({ prefix: 'uploads/', limit: 1000 });
    return blobs
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
      .map((b) => b.url);
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

export interface MaintenanceModeConfig {
  enabled: boolean;
  title: string;
  message: string;
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
  maintenanceMode?: MaintenanceModeConfig;
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
  const row = await prisma.siteSettings.findUnique({ where: { key: 'gallery-cabana' } });
  const photos = (row?.value as unknown as CabanaPhoto[]) ?? [];
  return photos.sort((a, b) => a.order - b.order);
}

export async function saveCabanaGallery(photos: CabanaPhoto[]): Promise<void> {
  await prisma.siteSettings.upsert({
    where: { key: 'gallery-cabana' },
    create: { key: 'gallery-cabana', value: photos as never },
    update: { value: photos as never },
  });
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
  const row = await prisma.siteSettings.findUnique({ where: { key: 'gallery-rivers-land' } });
  const photos = (row?.value as unknown as RiversLandPhoto[]) ?? [];
  return photos.sort((a, b) => a.order - b.order);
}

export async function saveRiversLandGallery(photos: RiversLandPhoto[]): Promise<void> {
  await prisma.siteSettings.upsert({
    where: { key: 'gallery-rivers-land' },
    create: { key: 'gallery-rivers-land', value: photos as never },
    update: { value: photos as never },
  });
}

export interface RiversMarinaPhoto {
  id: string;
  src: string;
  caption: string;
  order: number;
}

export async function getRiversMarinaGallery(): Promise<RiversMarinaPhoto[]> {
  const row = await prisma.siteSettings.findUnique({ where: { key: 'gallery-rivers-marina' } });
  const photos = (row?.value as unknown as RiversMarinaPhoto[]) ?? [];
  return photos.sort((a, b) => a.order - b.order);
}

export async function saveRiversMarinaGallery(photos: RiversMarinaPhoto[]): Promise<void> {
  await prisma.siteSettings.upsert({
    where: { key: 'gallery-rivers-marina' },
    create: { key: 'gallery-rivers-marina', value: photos as never },
    update: { value: photos as never },
  });
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
  referredByCode?: string;
  googleId?: string | null;
  facebookId?: string | null;
  avatarUrl?: string | null;
  authProvider?: string | null;
  marketingConsent?: boolean;
  marketingConsentAt?: string;
  unsubscribedAt?: string | null;
}

// ── Users — DB-backed ───────────────────────────────────────────────────────

function mapDbToUser(row: {
  id: string; createdAt: Date; lastLoginAt: Date | null; lastActivityAt: Date | null;
  retentionNotifiedAt: Date | null; name: string; email: string; phone: string | null;
  passwordHash: string; isActive: boolean; role: string; totalOrders: number;
  totalSpent: number; lastOrderAt: Date | null; adminNote: string | null;
  isVerified: boolean; verifiedAt: Date | null; verifiedBy: string | null;
  avatar: string | null; birthday: string | null;
  googleId?: string | null; facebookId?: string | null;
  avatarUrl?: string | null; authProvider?: string | null;
  marketingConsent?: boolean; marketingConsentAt?: Date | null;
  unsubscribedAt?: Date | null;
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
    googleId: row.googleId ?? null,
    facebookId: row.facebookId ?? null,
    avatarUrl: row.avatarUrl ?? null,
    authProvider: row.authProvider ?? null,
    marketingConsent: row.marketingConsent ?? false,
    marketingConsentAt: row.marketingConsentAt?.toISOString(),
    unsubscribedAt: row.unsubscribedAt?.toISOString() ?? null,
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
    marketingConsent: u.marketingConsent ?? false,
    marketingConsentAt: u.marketingConsentAt ? new Date(u.marketingConsentAt) : null,
    unsubscribedAt: u.unsubscribedAt ? new Date(u.unsubscribedAt) : null,
  };
}

function mapUserCreate(u: User) {
  return {
    ...mapUserUpdate(u),
    id: u.id,
    clientCode: `RL-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
    referredByCode: u.referredByCode ?? null,
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

// ── Operators — DB-backed ───────────────────────────────────────────────────

function mapDbToOperator(row: {
  id: string; name: string; username: string; role: string; passwordHash: string;
  pin: string | null; isActive: boolean; totalOrdersProcessed: number;
  totalReservationsProcessed: number; loginHistory: unknown; activityLog: unknown;
  createdAt: Date; lastLoginAt: Date | null; lastActivityAt: Date | null;
}): Operator {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    role: row.role as Operator['role'],
    passwordHash: row.passwordHash,
    pin: row.pin ?? undefined,
    isActive: row.isActive,
    totalOrdersProcessed: row.totalOrdersProcessed,
    totalReservationsProcessed: row.totalReservationsProcessed,
    loginHistory: (row.loginHistory as Operator['loginHistory']) ?? [],
    activityLog: (row.activityLog as Operator['activityLog']) ?? [],
    createdAt: row.createdAt.toISOString(),
    lastLoginAt: row.lastLoginAt?.toISOString() ?? '',
    lastActivityAt: row.lastActivityAt?.toISOString() ?? '',
  };
}

export async function getOperators(): Promise<Operator[]> {
  const rows = await prisma.operator.findMany({ orderBy: { createdAt: 'asc' } });
  return rows.map(mapDbToOperator);
}

export async function saveOperators(operators: Operator[]): Promise<void> {
  const ids = operators.map((o) => o.id);
  await prisma.$transaction(async (tx) => {
    if (ids.length > 0) {
      await tx.operator.deleteMany({ where: { id: { notIn: ids } } });
    } else {
      await tx.operator.deleteMany({});
    }
    for (const op of operators) {
      const data = {
        name: op.name,
        username: op.username,
        role: op.role,
        passwordHash: op.passwordHash,
        pin: op.pin ?? null,
        isActive: op.isActive,
        totalOrdersProcessed: op.totalOrdersProcessed,
        totalReservationsProcessed: op.totalReservationsProcessed,
        loginHistory: (op.loginHistory ?? []) as never,
        activityLog: (op.activityLog ?? []) as never,
        lastLoginAt: op.lastLoginAt ? new Date(op.lastLoginAt) : null,
        lastActivityAt: op.lastActivityAt && op.lastActivityAt !== '' ? new Date(op.lastActivityAt) : null,
      };
      await tx.operator.upsert({
        where: { id: op.id },
        create: { id: op.id, createdAt: op.createdAt ? new Date(op.createdAt) : new Date(), ...data },
        update: data,
      });
    }
  });
}

export async function getOperatorById(id: string): Promise<Operator | null> {
  const row = await prisma.operator.findUnique({ where: { id } });
  return row ? mapDbToOperator(row) : null;
}

export async function getOperatorByUsername(username: string): Promise<Operator | null> {
  const row = await prisma.operator.findFirst({
    where: { username: { equals: username, mode: 'insensitive' } },
  });
  return row ? mapDbToOperator(row) : null;
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
  isPriority?: boolean;
  priorityLevel?: number;
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
  isPriority: boolean; priorityLevel: number | null;
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
    isPriority: row.isPriority ?? false,
    priorityLevel: row.priorityLevel ?? undefined,
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
    isPriority: o.isPriority ?? false,
    priorityLevel: o.priorityLevel ?? null,
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
