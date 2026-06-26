import { getSettings } from '@/lib/server-data';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import { DailyMenuAdminClient } from '@/components/admin/daily-menu-admin-client';
import type { DailyMenuConfig } from '@/lib/server-data';

export const metadata = { title: "Meniu Zilei | Admin River's Lounge" };

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
    monday:    { type: 'meniu-zilei', title: '', description: '', price: 0 },
    tuesday:   { type: 'meniu-zilei', title: '', description: '', price: 0 },
    wednesday: { type: 'meniu-zilei', title: '', description: '', price: 0 },
    thursday:  { type: 'meniu-zilei', title: '', description: '', price: 0 },
    friday:    { type: 'meniu-zilei', title: '', description: '', price: 0 },
    saturday:  { type: 'mic-dejun',   title: '', description: '', price: 0 },
    sunday:    { type: 'mic-dejun',   title: '', description: '', price: 0 },
  },
};

export default async function MeniuZileiAdminPage() {
  const session = await getSession();
  if (!session || !hasPermission(session.role, 'meniu-zilei.view')) redirect('/admin');

  const settings = await getSettings();
  const config: DailyMenuConfig = settings.dailyMenu ?? DEFAULT_DAILY_MENU;

  return (
    <div className="p-6 lg:p-8 lg:pt-8 pt-20">
      <div className="mb-8">
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
          🍽️ Meniu Zilei & Mic Dejun
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Configurează oferta zilnică afișată pe site ca banner sau popup
        </p>
      </div>

      <DailyMenuAdminClient initialConfig={config} />
    </div>
  );
}
