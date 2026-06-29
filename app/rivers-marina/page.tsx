import { SiteLayout } from '@/components/layout/site-layout';
import { PageHero } from '@/components/layout/page-hero';
import { PhotoMosaic } from '@/components/rivers-land/photo-mosaic';
import { CabinUpcomingEvents } from '@/components/cabin/cabin-upcoming-events';
import { Music, Wine, Ship, Phone, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { getSettings, getRiversMarinaGallery } from '@/lib/server-data';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "River's Marina | Club & Evenimente",
  description:
    "River's Marina — club exclusivist, evenimente live și vibrații de lounge la malul apei, în cadrul complexului River's Lounge din Călărași.",
  alternates: { canonical: '/rivers-marina' },
  openGraph: {
    title: "River's Marina | Club & Evenimente | River's Lounge",
    description: "River's Marina — club exclusivist și evenimente live la malul apei în Călărași.",
    url: '/rivers-marina',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: "River's Marina" }],
  },
  twitter: { card: 'summary_large_image' as const, images: ['/og-image.jpg'] },
};

const HERO_FALLBACK =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=600&fit=crop';

const FEATURE_FALLBACK =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&h=700&fit=crop';

const FEATURES = [
  {
    icon: Music,
    title: 'Evenimente Live',
    description: 'Concerte, DJ sets și performance-uri artistice exclusiviste direct la malul apei.',
  },
  {
    icon: Wine,
    title: 'Club & Lounge',
    description: 'Atmosferă premium, cocktailuri rafinate și o selecție atentă de băuturi fine.',
  },
  {
    icon: Ship,
    title: 'Evenimente Private',
    description: 'Organizăm petreceri private, team building și celebrări de neuitat pe malul Dunării.',
  },
];

export default async function RiversMarinaPage() {
  const [settings, galleryPhotos] = await Promise.all([
    getSettings(),
    getRiversMarinaGallery(),
  ]);

  const heroImage = settings.heroImages?.riversMarina || HERO_FALLBACK;
  const featureImage = settings.heroImages?.riversMarinaFeature || FEATURE_FALLBACK;

  const hasPhotos = galleryPhotos.some((p) => p.src);

  const mosaicPhotos = galleryPhotos.map((p) => ({
    id: p.id,
    src: p.src,
    caption: p.caption || undefined,
  }));

  return (
    <SiteLayout>
      <PageHero
        badge="🌊 Locație Exclusivă"
        title="River's Marina"
        subtitle="Evenimente unice și vibrații de club, la malul apei"
        backgroundImage={heroImage}
      />

      {/* Intro section — 2 col */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block text-primary text-sm font-semibold tracking-widest uppercase mb-4">
                Despre River&apos;s Marina
              </span>
              <h2 className="font-serif text-3xl font-bold text-foreground mb-6">
                O experiență <span className="text-primary">unică</span> la malul apei
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                River&apos;s Marina este destinația premium pentru cei care caută o noapte de neuitat —
                muzică live, atmosferă de club și priveliștea fascinantă a apei, totul într-un cadru exclusivist.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-8">
                De la serate cu DJ seturi până la concerte private și petreceri tematice, oferim
                experiențe personalizate care combină rafinamentul cu energia unui club de top.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/rezervari">
                  <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Ship className="h-5 w-5" />
                    Rezervă un eveniment
                  </Button>
                </Link>
                <a href="tel:0734642449">
                  <Button size="lg" variant="outline" className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/10">
                    <Phone className="h-5 w-5" />
                    Sună acum
                  </Button>
                </a>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden h-80 lg:h-[460px] shadow-2xl">
              <Image
                src={featureImage}
                alt="River's Marina"
                fill
                className="object-cover"
                unoptimized={featureImage.startsWith('/')}
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="py-16 bg-secondary/30">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold text-foreground mb-3">
              Ce oferim la <span className="text-primary">River&apos;s Marina</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Trei experiențe distincte, un singur loc de neuitat
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="p-8 rounded-2xl bg-card border border-border text-center hover:border-primary/40 transition-colors"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-5">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="font-serif text-lg font-bold text-foreground mb-3">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Info strip */}
      <section className="py-14">
        <div className="mx-auto max-w-4xl px-4 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: Clock, label: 'Program', value: 'Vineri & Sâmbătă: 22:00 – 04:00' },
              { icon: MapPin, label: 'Locație', value: "Complex River's Lounge, Călărași" },
              { icon: Phone, label: 'Rezervări', value: '0734 642 449' },
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
        </div>
      </section>

      {/* Photo gallery — only shown when at least one photo has been uploaded */}
      {hasPhotos && (
        <section className="py-16 bg-secondary/30">
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
                Momente din viața de la River&apos;s Marina
              </p>
            </div>
            <PhotoMosaic photos={mosaicPhotos} />
          </div>
        </section>
      )}

      <CabinUpcomingEvents filterLocation="River's Marina" />

      {/* CTA banner */}
      <section
        className="py-20"
        style={{ background: 'linear-gradient(135deg, #1a1208 0%, #2d1f00 50%, #1a1208 100%)' }}
      >
        <div className="mx-auto max-w-3xl px-4 lg:px-8 text-center">
          <div className="text-4xl mb-4">🌊</div>
          <h2 className="font-serif text-3xl font-bold text-white mb-4">
            Rezervă acum locul tău la River&apos;s Marina
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
            Locurile sunt limitate. Contactează-ne pentru a rezerva o masă VIP sau a organiza un eveniment privat.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/rezervari">
              <Button
                size="lg"
                className="gap-2 font-semibold"
                style={{ background: '#C9A84C', color: '#0F0F0F' }}
              >
                <Ship className="h-5 w-5" />
                Rezervă un eveniment
              </Button>
            </Link>
            <a href="tel:0734642449">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-white/30 text-white hover:bg-white/10"
              >
                <Phone className="h-5 w-5" />
                0734 642 449
              </Button>
            </a>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
