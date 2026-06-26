import { SiteLayout } from '@/components/layout/site-layout';
import { PageHero } from '@/components/layout/page-hero';
import { MenuContent, MobileCartButton } from '@/components/menu/menu-content';
import { getMenuItems, getSettings } from '@/lib/server-data';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Meniu & Comenzi Online | River's Lounge",
  description: "Comandă mâncare online de la River's Lounge — livrare rapidă în Călărași.",
};

const FALLBACK = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&h=600&fit=crop';

export default async function MenuPage() {
  const [products, settings] = await Promise.all([getMenuItems(), getSettings()]);

  const drinks = products
    .filter((p) => p.category === 'drinks' && (p.status === 'disponibil' || (!p.status && p.available)))
    .slice(0, 6);

  return (
    <SiteLayout>
      <PageHero
        badge="Comandă Acum"
        title="Meniu & Comenzi"
        subtitle="Alege din preparatele noastre și comandă online cu livrare rapidă"
        backgroundImage={settings.heroImages?.meniu || FALLBACK}
      />
      <MenuContent products={products} />
      <MobileCartButton drinks={drinks} />
    </SiteLayout>
  );
}
