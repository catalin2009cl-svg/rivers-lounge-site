import { SiteLayout } from '@/components/layout/site-layout';
import { PageHero } from '@/components/layout/page-hero';

export const metadata = {
  title: "Cariere | River's Lounge",
  description: "Alătură-te echipei River's Lounge. Vezi pozițiile disponibile.",
};

export default function CarierePage() {
  return (
    <SiteLayout>
      <PageHero
        badge="Cariere"
        title="Cariere"
        subtitle="Fă parte din echipa Rivers Lounge"
        backgroundImage="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&h=600&fit=crop"
      />
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <div className="text-muted-foreground leading-relaxed space-y-6">
            <p className="text-lg">
              Momentan nu avem poziții deschise.
            </p>
            <p>
              Dacă ești pasionat de ospitalitate și vrei să faci parte din echipa Rivers Lounge,
              trimite CV-ul tău la:{' '}
              <a
                href="mailto:renetrading@yahoo.com"
                className="text-primary hover:underline"
              >
                renetrading@yahoo.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
