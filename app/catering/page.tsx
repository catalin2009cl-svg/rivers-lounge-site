import { SiteLayout } from '@/components/layout/site-layout';
import { PageHero } from '@/components/layout/page-hero';

export const metadata = {
  title: "Catering | River's Lounge",
  description: "Servicii de catering pentru evenimente corporate, nunți, botezuri și petreceri private în Călărași.",
};

export default function CateringPage() {
  return (
    <SiteLayout>
      <PageHero
        badge="Catering"
        title="Servicii de Catering"
        subtitle="Aducem experiența Rivers Lounge la evenimentul tău"
        backgroundImage="https://images.unsplash.com/photo-1555244162-803834f70033?w=1920&h=600&fit=crop"
      />
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <div className="text-muted-foreground leading-relaxed space-y-6">
            <p className="text-lg">
              Oferim servicii complete de catering pentru evenimente corporate, nunți, botezuri
              și petreceri private.
            </p>
            <p>
              Contactați-ne pentru o ofertă personalizată:
            </p>
            <ul className="space-y-2 list-none pl-0">
              <li>
                Telefon:{' '}
                <a href="tel:+40734642449" className="text-primary hover:underline">
                  0734 642 449
                </a>
              </li>
              <li>
                Email:{' '}
                <a href="mailto:contact@riverslounge.ro" className="text-primary hover:underline">
                  contact@riverslounge.ro
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
