import { SiteLayout } from '@/components/layout/site-layout';
import { PageHero } from '@/components/layout/page-hero';
import { NewsContent } from '@/components/news/news-content';
import { getSettings } from '@/lib/server-data';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Noutăți & Evenimente | River's Lounge",
  description: 'Ultimele noutăți, evenimente și promoții de la River\'s Lounge.',
};

const FALLBACK = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&h=600&fit=crop';

export default async function NewsPage() {
  const settings = await getSettings();

  return (
    <SiteLayout>
      <PageHero
        badge="Noutăți"
        title="Noutăți & Evenimente"
        subtitle="Află ultimele noutăți, evenimente și promoții de la River's Lounge"
        backgroundImage={settings.heroImages?.noutati || FALLBACK}
      />
      <NewsContent />
    </SiteLayout>
  );
}
