import { SiteLayout } from '@/components/layout/site-layout';
import { PageHero } from '@/components/layout/page-hero';

export const metadata = {
  title: "Despre Noi | River's Lounge",
  description: "Aflați povestea River's Lounge — restaurant, evenimente și relaxare în Călărași.",
};

export default function DesprePage() {
  return (
    <SiteLayout>
      <PageHero
        badge="Despre Noi"
        title="Despre Rivers Lounge"
        subtitle="Locul unde gastronomia întâlnește eleganța"
        backgroundImage="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&h=600&fit=crop"
      />
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <div className="prose prose-lg dark:prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
            <p>
              Rivers Lounge este un loc unde gastronomia întâlnește eleganța. Restaurantul nostru
              oferă o experiență culinară completă, cu preparate tradiționale și internaționale,
              într-un ambient cald și primitor.
            </p>
            <p>
              Suntem mai mult decât un restaurant — suntem locul unde momentele speciale prind
              viață. De la cine romantice la evenimente private, de la brunch-uri relaxante la
              petreceri tematice la Cabana Rivers, vă așteptăm cu drag.
            </p>
            <p>
              Echipa noastră este dedicată să facă fiecare vizită memorabilă.
            </p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
