'use server';

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getSettings, saveSettings } from '@/lib/server-data';
import type {
  SiteSettings,
  DeliveryConfig,
  PopupConfig,
  BrandingConfig,
  DailyMenuConfig,
  DailyMenuBannerData,
  DailyMenuScheduleDay,
} from '@/lib/server-data';

const DEFAULT_BRANDING: BrandingConfig = {
  logoLight: '/uploads/1782418815754-6p2rttowpm3.png',
  logoDark: '',
  favicon: '/favicon.ico',
  ogImage: '',
  logoWidth: 140,
  logoHeight: 44,
};

import { revalidatePath } from 'next/cache';

const PAGE_ROUTES: Record<string, string> = {
  acasa: '/',
  meniu: '/meniu',
  rezervari: '/rezervari',
  cabana: '/cabana',
  noutati: '/noutati',
  contact: '/contact',
};

export async function updateSettings(
  data: Partial<Omit<SiteSettings, 'heroImages' | 'heroImage' | 'heroTitle' | 'heroSubtitle'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const current = await getSettings();
    // Explicitly merge only the contact-info fields — heroImages are managed by updateHeroImage
    // and must never be overwritten here, even if the client accidentally sends them.
    await saveSettings({
      ...current,
      hours: data.hours ?? current.hours,
      phone: data.phone ?? current.phone,
      email: data.email ?? current.email,
      address: data.address ?? current.address,
      addressCabana: data.addressCabana ?? current.addressCabana,
    });
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateHeroImage(
  page: string,
  imagePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const current = await getSettings();
    await saveSettings({
      ...current,
      heroImages: { ...(current.heroImages ?? {}), [page]: imagePath },
    });
    // 'layout' scope invalidates every cached page that shares this layout — covers all routes at once
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateDeliverySettings(
  delivery: DeliveryConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const current = await getSettings();
    await saveSettings({ ...current, delivery });
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updatePopupSettings(
  popup: PopupConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const current = await getSettings();
    await saveSettings({
      ...current,
      popup: {
        ...popup,
        createdAt: new Date().toISOString(), // reset showOnce for all visitors on every save
      },
    });
    revalidatePath('/');
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function togglePopup(
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const current = await getSettings();
    if (!current.popup) return { success: false, error: 'Nicio configurație popup.' };
    await saveSettings({ ...current, popup: { ...current.popup, enabled } });
    revalidatePath('/');
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateBranding(
  branding: BrandingConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const current = await getSettings();
    await saveSettings({ ...current, branding });
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function uploadBrandingImage(
  formData: FormData,
  type: 'light' | 'dark' | 'favicon' | 'og'
): Promise<{ url: string } | { error: string }> {
  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) return { error: 'Niciun fișier selectat.' };

  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/x-icon', 'image/svg+xml'];
  if (!ALLOWED.includes(file.type)) return { error: 'Format nesuportat. Folosiți PNG, JPG, WebP, ICO sau SVG.' };
  if (file.size > 5 * 1024 * 1024) return { error: 'Fișierul este prea mare (max 5 MB).' };

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
  const filename = `${type}-${Date.now()}.${ext}`;
  const brandingDir = path.join(process.cwd(), 'public', 'uploads', 'branding');

  try {
    await mkdir(brandingDir, { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(path.join(brandingDir, filename), Buffer.from(bytes));
    const url = `/uploads/branding/${filename}`;

    const fieldMap: Record<typeof type, keyof BrandingConfig> = {
      light: 'logoLight',
      dark: 'logoDark',
      favicon: 'favicon',
      og: 'ogImage',
    };
    const current = await getSettings();
    await saveSettings({
      ...current,
      branding: { ...(current.branding ?? DEFAULT_BRANDING), [fieldMap[type]]: url },
    });
    revalidatePath('/', 'layout');
    return { url };
  } catch (e) {
    return { error: `Eroare la salvare: ${String(e)}` };
  }
}

const DEFAULT_DAILY_MENU_SCHEDULE_DAY = (type: 'meniu-zilei' | 'mic-dejun') => ({
  type,
  title: '',
  description: '',
  price: 0,
} as const);

const DEFAULT_DAILY_MENU: DailyMenuConfig = {
  enabled: false,
  type: 'meniu-zilei',
  title: '',
  subtitle: '',
  description: '',
  price: 0,
  oldPrice: 0,
  image: '',
  validUntil: '',
  showAsBanner: true,
  showAsPopup: false,
  ctaLabel: 'Comandă acum',
  ctaUrl: '/comanda/checkout',
  schedule: {
    enabled: false,
    monday:    DEFAULT_DAILY_MENU_SCHEDULE_DAY('meniu-zilei'),
    tuesday:   DEFAULT_DAILY_MENU_SCHEDULE_DAY('meniu-zilei'),
    wednesday: DEFAULT_DAILY_MENU_SCHEDULE_DAY('meniu-zilei'),
    thursday:  DEFAULT_DAILY_MENU_SCHEDULE_DAY('meniu-zilei'),
    friday:    DEFAULT_DAILY_MENU_SCHEDULE_DAY('meniu-zilei'),
    saturday:  DEFAULT_DAILY_MENU_SCHEDULE_DAY('mic-dejun'),
    sunday:    DEFAULT_DAILY_MENU_SCHEDULE_DAY('mic-dejun'),
  },
};

export async function updateDailyMenu(
  dailyMenu: DailyMenuConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const current = await getSettings();
    await saveSettings({ ...current, dailyMenu });
    revalidatePath('/');
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function toggleDailyMenu(
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const current = await getSettings();
    const existing = current.dailyMenu ?? DEFAULT_DAILY_MENU;
    await saveSettings({ ...current, dailyMenu: { ...existing, enabled } });
    revalidatePath('/');
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
type DayKey = typeof DAY_KEYS[number];

export async function getTodaysDailyMenu(): Promise<DailyMenuBannerData | null> {
  try {
    const settings = await getSettings();
    const dm = settings.dailyMenu;
    if (!dm || !dm.enabled) return null;

    let content: { type: 'meniu-zilei' | 'mic-dejun'; title: string; description: string; price: number } & Partial<{ oldPrice: number; image: string; validUntil: string }>;

    if (dm.schedule?.enabled) {
      const todayKey = DAY_KEYS[new Date().getDay()] as DayKey;
      const day = dm.schedule[todayKey] as DailyMenuScheduleDay;
      if (!day?.title?.trim()) return null;
      content = { type: day.type, title: day.title, description: day.description, price: day.price };
    } else {
      if (!dm.title?.trim()) return null;
      // Check validUntil (time like "15:00")
      if (dm.validUntil?.trim()) {
        const [h, m] = dm.validUntil.split(':').map(Number);
        const now = new Date();
        if (now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m)) return null;
      }
      content = {
        type: dm.type,
        title: dm.title,
        description: dm.description,
        price: dm.price,
        oldPrice: dm.oldPrice > 0 ? dm.oldPrice : undefined,
        image: dm.image || undefined,
        validUntil: dm.validUntil || undefined,
      };
    }

    return {
      ...content,
      ctaLabel: dm.ctaLabel || 'Comandă acum',
      ctaUrl: dm.ctaUrl || '/comanda/checkout',
      showAsBanner: dm.showAsBanner ?? true,
      showAsPopup: dm.showAsPopup ?? false,
    };
  } catch {
    return null;
  }
}

export async function uploadHeroImage(
  formData: FormData,
  page = 'hero'
): Promise<{ url: string } | { error: string }> {
  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) return { error: 'Niciun fișier selectat.' };

  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
  if (!ALLOWED.includes(file.type)) return { error: 'Tip nepermis. Folosiți JPG, PNG sau WebP.' };
  if (file.size > 10 * 1024 * 1024) return { error: 'Fișierul este prea mare (max 10 MB).' };

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const filename = `${page}-${Date.now()}.${ext}`;
  const heroDir = path.join(process.cwd(), 'public', 'uploads', 'hero');

  try {
    await mkdir(heroDir, { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(path.join(heroDir, filename), Buffer.from(bytes));
    return { url: `/uploads/hero/${filename}` };
  } catch (e) {
    return { error: `Eroare la salvare: ${String(e)}` };
  }
}
