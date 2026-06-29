import { SiteLayout } from '@/components/layout/site-layout';
import { PageHero } from '@/components/layout/page-hero';
import { ContactContent } from '@/components/contact/contact-content';
import { getSettings } from '@/lib/server-data';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Contact',
  description: "Contactează River's Lounge pentru rezervări, evenimente sau informații. Str. Dobrogei nr. 1, Călărași. Tel: 0734 642 449.",
  alternates: { canonical: '/contact' },
  openGraph: {
    title: "Contact | River's Lounge",
    description: "Contactează River's Lounge pentru rezervări, evenimente sau informații.",
    url: '/contact',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: "Contact River's Lounge" }],
  },
  twitter: { card: 'summary_large_image' as const, images: ['/og-image.jpg'] },
};

const FALLBACK = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&h=600&fit=crop';

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <SiteLayout>
      <PageHero
        badge="Contact"
        title="Contactează-ne"
        subtitle="Suntem aici pentru rezervări, evenimente și orice întrebări ai avea"
        backgroundImage={settings.heroImages?.contact || FALLBACK}
      />
      <ContactContent
        schedule={settings.hours}
        phone={settings.phone}
        email={settings.email}
        address={settings.address}
      />
    </SiteLayout>
  );
}
