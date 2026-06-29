import { SiteLayout } from '@/components/layout/site-layout';
import { PageHero } from '@/components/layout/page-hero';
import { NewsContent } from '@/components/news/news-content';
import { getSettings } from '@/lib/server-data';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Noutăți & Evenimente',
  description: "Ultimele noutăți, evenimente și promoții de la River's Lounge din Călărași. Concerte, petreceri tematice, oferte speciale.",
  alternates: { canonical: '/noutati' },
  openGraph: {
    title: "Noutăți & Evenimente | River's Lounge",
    description: "Ultimele noutăți, evenimente și promoții de la River's Lounge.",
    url: '/noutati',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: "Noutăți River's Lounge" }],
  },
  twitter: { card: 'summary_large_image' as const, images: ['/og-image.jpg'] },
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
