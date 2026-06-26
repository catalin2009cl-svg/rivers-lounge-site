import { SiteLayout } from '@/components/layout/site-layout';
import { PageHero } from '@/components/layout/page-hero';
import { RestaurantContent } from '@/components/restaurant/restaurant-content';
import { getSettings } from '@/lib/server-data';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Restaurant | River's Lounge",
  description: 'Restaurant premium în Călărași — bucătărie tradițională și internațională într-un ambient elegant.',
};

const HERO_FALLBACK =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&h=600&fit=crop';

export default async function RestaurantPage() {
  const settings = await getSettings();
  const heroImage = settings.heroImages?.restaurant || HERO_FALLBACK;

  return (
    <SiteLayout>
      <PageHero
        badge="Restaurant"
        title="Restaurant River's Lounge"
        subtitle="Bucătărie rafinată, bar premium și o atmosferă caldă în inima Călărașiului"
        backgroundImage={heroImage}
      />
      <RestaurantContent />
    </SiteLayout>
  );
}
