import { SiteLayout } from '@/components/layout/site-layout';
import { PageHero } from '@/components/layout/page-hero';
import { ContactContent } from '@/components/contact/contact-content';
import { getSettings } from '@/lib/server-data';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Contact | River's Lounge",
  description: 'Contactează River\'s Lounge pentru rezervări, evenimente sau informații.',
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
