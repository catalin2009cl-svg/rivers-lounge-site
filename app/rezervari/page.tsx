import { SiteLayout } from '@/components/layout/site-layout';
import { PageHero } from '@/components/layout/page-hero';
import { ReservationForm } from '@/components/reservations/reservation-form';
import { getSettings } from '@/lib/server-data';
import { getCurrentUser } from '@/lib/actions/auth-user';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Rezervări',
  description: "Rezervă masă la restaurant, cabana sau organizează un eveniment privat la River's Lounge din Călărași.",
  alternates: { canonical: '/rezervari' },
  openGraph: {
    title: "Rezervări | River's Lounge",
    description: "Rezervă masă sau organizează un eveniment privat la River's Lounge.",
    url: '/rezervari',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: "Rezervări River's Lounge" }],
  },
  twitter: { card: 'summary_large_image' as const, images: ['/og-image.jpg'] },
};

const FALLBACK = 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1920&h=600&fit=crop';

export default async function ReservationsPage() {
  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()]);

  const currentUser = user
    ? { name: user.name, email: user.email, phone: user.phone }
    : undefined;

  return (
    <SiteLayout>
      <PageHero
        badge="Rezervări"
        title="Rezervări & Evenimente"
        subtitle="Rezervă o masă, cabana sau organizează evenimentul tău perfect"
        backgroundImage={settings.heroImages?.rezervari || FALLBACK}
      />
      <ReservationForm currentUser={currentUser} />
    </SiteLayout>
  );
}
