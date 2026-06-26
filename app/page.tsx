import { SiteLayout } from '@/components/layout/site-layout';
import { HeroSection } from '@/components/home/hero-section';
import { FacilitiesOverview } from '@/components/home/facilities-overview';
import { NewsSection } from '@/components/home/news-section';
import { PopularProducts } from '@/components/home/popular-products';
import { AboutSection } from '@/components/home/about-section';
import { TestimonialsSection } from '@/components/home/testimonials-section';
import { ContactSection } from '@/components/home/contact-section';
import { UpcomingEventsSection } from '@/components/home/upcoming-events-section';
import { SocialSection } from '@/components/home/social-section';
import { getMenuItems, getSettings } from '@/lib/server-data';
import { PromoPopup } from '@/components/popup/promo-popup';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [products, settings] = await Promise.all([getMenuItems(), getSettings()]);

  const hi = settings.heroImages;
  const cardImages: Record<string, string> = {
    restaurant: hi?.restaurant || '',
    'online-shop': hi?.meniu || '',
    events: hi?.rezervari || '',
    cabin: hi?.cabana || '',
    'rivers-land': hi?.riversLand || '',
    'rivers-marina': hi?.riversMarina || '',
  };

  return (
    <SiteLayout>
      <HeroSection heroImage={settings.heroImages?.acasa || settings.heroImage} />
      <FacilitiesOverview cardImages={cardImages} />
      <NewsSection />
      <AboutSection />
      <PopularProducts products={products} />
      <UpcomingEventsSection />
      <SocialSection />
      <TestimonialsSection />
      <ContactSection />
      {settings.popup && <PromoPopup popup={settings.popup} />}
    </SiteLayout>
  );
}
