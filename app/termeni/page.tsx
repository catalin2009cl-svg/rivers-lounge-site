import { SiteLayout } from '@/components/layout/site-layout';
import { PageHero } from '@/components/layout/page-hero';

export const metadata = {
  title: 'Termeni și Condiții',
  description: "Termenii și condițiile de utilizare a serviciilor River's Lounge.",
  alternates: { canonical: '/termeni' },
  robots: { index: false, follow: false },
};

export default function TermeniPage() {
  return (
    <SiteLayout>
      <PageHero
        badge="Legal"
        title="Termeni și Condiții"
        subtitle="Ultima actualizare: Iulie 2026"
        backgroundImage="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1920&h=600&fit=crop"
      />
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 lg:px-8 space-y-10 text-muted-foreground leading-relaxed">

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">1. Dispoziții generale</h2>
            <p>
              Prin utilizarea site-ului riverslounge.ro și a serviciilor RIVERS LOUNGE CROWD SRL,
              acceptați prezentele Termeni și Condiții. Vă rugăm să le citiți cu atenție înainte
              de a plasa o comandă sau de a efectua o rezervare.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">2. Rezervări</h2>
            <p>
              Rezervările se pot efectua prin intermediul site-ului, prin telefon sau prin
              WhatsApp. O rezervare este confirmată doar după ce primiți un mesaj de confirmare
              din partea echipei noastre.
            </p>
            <p>
              Vă rugăm să anunțați cel puțin 24 de ore înainte dacă doriți să anulați sau să
              modificați o rezervare. Absența nejustificată poate conduce la restricționarea
              accesului la serviciul de rezervări online.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">3. Comenzi online</h2>
            <p>
              Comenzile plasate pe site sunt estimate și fac obiectul disponibilității stocurilor.
              Prețurile afișate includ TVA și sunt exprimate în lei (RON). River&apos;s Lounge
              își rezervă dreptul de a modifica prețurile fără notificare prealabilă.
            </p>
            <p>
              Livrarea este gratuită în Călărași pentru comenzi de minimum 50 lei. Plata se
              efectuează la livrare, în numerar sau cu cardul.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">4. Politica de anulare</h2>
            <p>
              Comenzile pot fi anulate fără costuri în primele 5 minute de la plasare. După
              această perioadă, anularea nu mai este posibilă dacă prepararea a început. Pentru
              evenimente private, politica de anulare este stabilită în contractul individual.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">5. Limitarea răspunderii</h2>
            <p>
              River&apos;s Lounge nu răspunde pentru daune indirecte sau consecvente rezultate
              din utilizarea serviciilor noastre. Informațiile de pe site sunt furnizate cu bună
              credință și pot fi modificate fără notificare prealabilă.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">6. Proprietate intelectuală</h2>
            <p>
              Toate conținuturile de pe riverslounge.ro (texte, imagini, logo-uri) sunt
              proprietatea River&apos;s Lounge și sunt protejate de legislația privind drepturile
              de autor. Reproducerea fără acordul scris al proprietarului este interzisă.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">7. Contact</h2>
            <p>
              Pentru orice întrebări referitoare la acești termeni, ne puteți contacta la{' '}
              <a href="mailto:renetrading@yahoo.com" className="text-primary hover:underline">
                renetrading@yahoo.com
              </a>{' '}
              sau la telefon{' '}
              <a href="tel:+40725635020" className="text-primary hover:underline">
                0725 635 020
              </a>.
            </p>
          </div>

        </div>
      </section>
    </SiteLayout>
  );
}
