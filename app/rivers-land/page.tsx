import { SiteLayout } from '@/components/layout/site-layout';
import { PageHero } from '@/components/layout/page-hero';
import { PhotoMosaic } from '@/components/rivers-land/photo-mosaic';
import { CabinUpcomingEvents } from '@/components/cabin/cabin-upcoming-events';
import { Sparkles, Phone, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getSettings, getRiversLandGallery } from '@/lib/server-data';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "River's Land | Loc de Joacă pentru Copii",
  description:
    "River's Land — loc de joacă și distracție special amenajat pentru copii, în cadrul complexului River's Lounge din Călărași.",
  alternates: { canonical: '/rivers-land' },
  openGraph: {
    title: "River's Land | Loc de Joacă pentru Copii | River's Lounge",
    description: "River's Land — loc de joacă special amenajat pentru copii în Călărași.",
    url: '/rivers-land',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: "River's Land" }],
  },
  twitter: { card: 'summary_large_image' as const, images: ['/og-image.jpg'] },
};

const HERO_FALLBACK =
  'https://images.unsplash.com/photo-1575783970733-1aaedde1db74?w=1920&h=600&fit=crop';

export default async function RiversLandPage() {
  const [settings, galleryPhotos] = await Promise.all([
    getSettings(),
    getRiversLandGallery(),
  ]);

  const heroImage = settings.heroImages?.riversLand || HERO_FALLBACK;

  const hasPhotos = galleryPhotos.some((p) => p.src);

  const mosaicPhotos = galleryPhotos.map((p) => ({
    id: p.id,
    src: p.src,
    caption: p.caption || undefined,
  }));

  return (
    <SiteLayout>
      <PageHero
        badge="River's Land"
        title="Loc de Joacă & Distracție"
        subtitle="Activități și aventură pentru cei mici, într-un spațiu sigur și amenajat special"
        backgroundImage={heroImage}
      />

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 lg:px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6">
            <Sparkles className="h-10 w-10" />
          </div>
          <h2 className="font-serif text-3xl font-bold text-foreground mb-4">
            Aventură pentru <span className="text-primary">Cei Mici</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
            River&apos;s Land este un spațiu de joacă și distracție special amenajat pentru copii, în cadrul complexului
            River&apos;s Lounge. Activități diverse, siguranță maximă și distracție garantată!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Clock, label: 'Program', value: 'Luni – Duminică: 07:30 – 00:00' },
              { icon: MapPin, label: 'Locație', value: "Complex River's Lounge, Călărași" },
              { icon: Phone, label: 'Rezervări', value: '0725 635 020' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="p-6 rounded-2xl bg-card border border-border text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-3">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">{label}</p>
                <p className="text-sm text-muted-foreground">{value}</p>
              </div>
            ))}
          </div>

          <p className="text-muted-foreground mb-8">
            Pagina este în curs de actualizare. Pentru detalii și rezervări vă rugăm să ne contactați.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <a href="tel:0725635020">
              <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Phone className="h-5 w-5" />
                Sună: 0725 635 020
              </Button>
            </a>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/10">
                Contactează-ne
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <CabinUpcomingEvents filterLocation="River's Land" />

      {/* Photo gallery — only shown when at least one photo has been uploaded */}
      {hasPhotos && <section className="py-16 bg-secondary/30">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl font-bold tracking-tight mb-2">
              Galerie{' '}
              <span
                className="relative inline-block"
                style={{ color: 'var(--primary)' }}
              >
                Foto
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: 0,
                    bottom: -4,
                    width: '100%',
                    height: 3,
                    background: '#C9A84C',
                    borderRadius: 2,
                  }}
                />
              </span>
            </h2>
            <p className="text-muted-foreground mt-3">
              Momente de distracție și aventură
            </p>
          </div>
          <PhotoMosaic photos={mosaicPhotos} />
        </div>
      </section>}
    </SiteLayout>
  );
}
