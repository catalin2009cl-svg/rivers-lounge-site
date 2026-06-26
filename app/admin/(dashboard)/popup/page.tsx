import { getSettings } from '@/lib/server-data';
import { requireAuth } from '@/lib/auth';
import { PopupAdminClient } from '@/components/admin/popup-admin-client';

export const metadata = { title: "Popup Promoțional | Admin River's Lounge" };
export const dynamic = 'force-dynamic';

const DEFAULT_POPUP = {
  enabled: false,
  title: '',
  subtitle: '',
  description: '',
  type: 'promo' as const,
  badgeText: '',
  ctaLabel: '',
  ctaUrl: '',
  ctaSecondaryLabel: '',
  ctaSecondaryUrl: '',
  image: '',
  backgroundColor: '#1A1A1A',
  accentColor: '#C9A84C',
  showOnce: true,
  showDelay: 3,
  showAfterPages: 0,
  expiresAt: '',
  createdAt: '',
};

export default async function PopupAdminPage() {
  await requireAuth();
  const settings = await getSettings();
  return <PopupAdminClient initialPopup={settings.popup ?? DEFAULT_POPUP} />;
}
