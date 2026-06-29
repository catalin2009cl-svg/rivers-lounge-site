import { SiteLayout } from '@/components/layout/site-layout';
import { PageHero } from '@/components/layout/page-hero';
import { CabinContent } from '@/components/cabin/cabin-content';
import { CabinUpcomingEvents } from '@/components/cabin/cabin-upcoming-events';
import { PhotoDeck } from '@/components/cabin/photo-deck';
import { getSettings, getCabanaGallery, getCabinPackages } from '@/lib/server-data';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Cabana Rivers | Evenimente & Petreceri',
  description: 'Cabana Rivers — locul perfect pentru evenimente speciale, petreceri private și weekend-uri memorabile în natură, în Călărași.',
  alternates: { canonical: '/cabana' },
  openGraph: {
    title: "Cabana Rivers | Evenimente & Petreceri | River's Lounge",
    description: 'Cabana Rivers — locul perfect pentru evenimente speciale și petreceri private în natură.',
    url: '/cabana',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Cabana Rivers' }],
  },
  twitter: { card: 'summary_large_image' as const, images: ['/og-image.jpg'] },
};

const FALLBACK = 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=1920&h=600&fit=crop';
const FEATURE_FALLBACK = 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&h=600&fit=crop';

export default async function CabinPage() {
  const [settings, galleryPhotos, dbPackages] = await Promise.all([
    getSettings(),
    getCabanaGallery(),
    getCabinPackages(),
  ]);

  const deckPhotos = galleryPhotos.map((p) => ({
    id: p.id,
    src: p.src,
    caption: p.caption || undefined,
  }));

  return (
    <SiteLayout>
      <PageHero
        badge="Cabana Rivers"
        title="Evenimente & Petreceri Speciale"
        subtitle="Cabana destinată evenimentelor private — petreceri, team building, aniversări și escapade în natură"
        backgroundImage={settings.heroImages?.cabana || FALLBACK}
      />
      <CabinContent
        featureImage={settings.heroImages?.cabanaFeature || FEATURE_FALLBACK}
        packages={dbPackages}
      />

      {/* Photo gallery */}
      <section className="py-16 bg-secondary/30">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight mb-2">Galerie Foto</h2>
            <p className="text-muted-foreground">
              Descoperă spațiile Cabanei Rivers prin fotografii
            </p>
          </div>
          <PhotoDeck photos={deckPhotos} />
        </div>
      </section>

      {/* Location section */}
      <section className="py-16 bg-[#1a1a1a]">
        <div className="mx-auto max-w-4xl px-4 lg:px-8">
          {/* Heading */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight mb-2">📍 Unde Ne Găsești</h2>
            <p className="text-muted-foreground">Cabana Rivers — Călărași</p>
          </div>

          {/* Map */}
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #2E2E2E' }}>
            <iframe
              src="https://www.google.com/maps?q=44.19232940673828,27.3138427734375&z=17&hl=ro&output=embed"
              width="100%"
              height="450"
              style={{ border: 0, display: 'block' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Locație Cabana Rivers"
            />
          </div>

          {/* Open in Maps button */}
          <div className="flex justify-center mt-5">
            <a
              href="https://www.google.com/maps?q=44.19232940673828,27.3138427734375&z=17&hl=ro"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
            >
              🗺️ Deschide în Google Maps
            </a>
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div className="bg-[#111] border border-[#2E2E2E] rounded-xl p-5">
              <p className="text-lg mb-3">📍</p>
              <p className="text-sm font-semibold text-white mb-1">Adresă</p>
              <p className="text-sm text-muted-foreground">Cabana Rivers</p>
              <p className="text-sm text-muted-foreground">Călărași, România</p>
            </div>
            <div className="bg-[#111] border border-[#2E2E2E] rounded-xl p-5">
              <p className="text-lg mb-3">🚗</p>
              <p className="text-sm font-semibold text-white mb-1">Acces</p>
              <p className="text-sm text-muted-foreground">Accesibil cu mașina</p>
              <p className="text-sm text-muted-foreground">Parcare disponibilă</p>
            </div>
            <div className="bg-[#111] border border-[#2E2E2E] rounded-xl p-5">
              <p className="text-lg mb-3">📞</p>
              <p className="text-sm font-semibold text-white mb-1">Contact</p>
              <a href="tel:0725635020" className="text-sm text-muted-foreground hover:text-primary transition-colors block">
                0725 635 020
              </a>
              <a href="mailto:contact@riverslounge.ro" className="text-sm text-muted-foreground hover:text-primary transition-colors block">
                contact@riverslounge.ro
              </a>
            </div>
          </div>
        </div>
      </section>

      <CabinUpcomingEvents filterLocation="Cabana Rivers" />
    </SiteLayout>
  );
}
