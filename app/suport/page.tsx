import Link from 'next/link';
import { Phone, Mail, MessageCircle } from 'lucide-react';
import { SiteLayout } from '@/components/layout/site-layout';
import { PageHero } from '@/components/layout/page-hero';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SupportContactForm } from './SupportContactForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Suport Clienți',
  description: "Ai nevoie de ajutor? Contactează echipa River's Lounge sau găsește răspunsuri în secțiunea FAQ.",
  alternates: { canonical: '/suport' },
  openGraph: {
    title: "Suport Clienți | River's Lounge",
    description: "Ai nevoie de ajutor? Contactează echipa River's Lounge sau găsește răspunsuri în FAQ.",
    url: '/suport',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: "Suport River's Lounge" }],
  },
  twitter: { card: 'summary_large_image' as const, images: ['/og-image.jpg'] },
};

const faqCategories = [
  {
    category: 'Comenzi',
    items: [
      {
        q: 'Cum plasez o comandă?',
        a: 'Accesează secțiunea Meniu de pe riverslounge.ro, adaugă produsele dorite în coș și urmează pașii de checkout. Poți plăti cu numerar la livrare sau cu cardul online.',
      },
      {
        q: 'Care este timpul estimat de livrare?',
        a: 'Timpul estimat de livrare este de aproximativ 60 de minute, în funcție de zona de livrare și volumul comenzilor. Clienții cu statut premium beneficiază de livrare prioritară cu timp redus.',
      },
      {
        q: 'Pot anula o comandă după plasare?',
        a: 'Comenzile pot fi anulate în primele 5 minute de la plasare, contactând echipa noastră la 0725 635 020. După ce comanda a intrat în procesare, anularea nu mai este posibilă.',
      },
      {
        q: 'În ce zone livrați?',
        a: 'Livrăm în Călărași, Tonea și Modelu. Poți verifica dacă adresa ta este în zona de livrare direct în formularul de comandă.',
      },
      {
        q: 'Ce metode de plată acceptați?',
        a: 'Acceptăm numerar la livrare și plată online cu cardul prin procesatorul nostru de plăți securizat.',
      },
      {
        q: 'Comanda mea întârzie. Ce fac?',
        a: 'Dacă comanda întârzie mai mult de 90 de minute, te rugăm să ne contactezi la 0725 635 020 și îți vom oferi o actualizare în timp real.',
      },
    ],
  },
  {
    category: 'Rezervări',
    items: [
      {
        q: 'Cum fac o rezervare?',
        a: 'Accesează secțiunea Rezervări de pe riverslounge.ro și completează formularul cu datele dorite — dată, oră, număr de persoane și tipul evenimentului (restaurant, Cabana Rivers sau eveniment privat).',
      },
      {
        q: 'Pot modifica sau anula o rezervare?',
        a: 'Da, poți modifica sau anula rezervarea contactând echipa noastră la 0725 635 020 sau renetrading@yahoo.com cu cel puțin 24 de ore înainte.',
      },
      {
        q: 'Este necesară o garanție pentru rezervări?',
        a: 'Pentru rezervările obișnuite nu este necesară o garanție. Pentru evenimente private sau grupuri mari, te vom contacta pentru a stabili detaliile.',
      },
    ],
  },
  {
    category: 'Program de Fidelizare',
    items: [
      {
        q: 'Ce este programul de fidelizare Rivers Lounge?',
        a: 'Programul de fidelizare Rivers Lounge îți oferă recompense pe măsură ce comenzile tale se acumulează. Există 8 niveluri, fiecare cu beneficii exclusive: comenzi gratuite, cashback, livrare prioritară și multe altele.',
      },
      {
        q: 'Cum acumulez puncte/cashback?',
        a: 'Cashback-ul se acumulează automat la fiecare comandă finalizată, în funcție de nivelul tău de fidelizare. Poți vedea soldul portofelului tău în secțiunea Contul meu → Fidelizare.',
      },
      {
        q: 'Cum folosesc recompensa pentru comanda gratuită (Nivel 1)?',
        a: 'După finalizarea a 9 comenzi eligibile, vei primi automat o recompensă pentru o comandă gratuită. Aceasta va apărea în contul tău și poți aplica reducerea direct la checkout. Recompensa este valabilă 30 de zile.',
      },
      {
        q: 'Cashback-ul meu a expirat. Ce se întâmplă?',
        a: 'Creditul din portofel expiră dacă nu plasezi o comandă în perioada de valabilitate (30 de zile pentru Nivel 2, 90 de zile pentru Nivel 3+). După expirare, creditul nu mai poate fi recuperat, dar continuă să se acumuleze din comenzile noi.',
      },
      {
        q: 'Cum invit prieteni și câștig bonus referral?',
        a: 'Găsești codul tău unic de invitație (RL-XXXX) în Contul meu → Fidelizare. Distribuie codul prietenilor — când aceștia se înregistrează cu codul tău și finalizează prima comandă, ambii primiți beneficii exclusive.',
      },
    ],
  },
  {
    category: 'Cont și Date Personale',
    items: [
      {
        q: 'Cum îmi schimb parola?',
        a: 'Accesează Contul meu → Setări și folosește opțiunea de schimbare a parolei. Vei primi un email de confirmare.',
      },
      {
        q: 'Cum îmi șterg contul?',
        a: 'Poți solicita ștergerea contului din Contul meu → Setări → Șterge contul, sau trimițând un email la renetrading@yahoo.com. Vom procesa solicitarea în termen de 30 de zile conform GDPR.',
      },
      {
        q: 'Cum îmi actualizez datele personale?',
        a: 'Accesează Contul meu → Setări pentru a actualiza numele, emailul, numărul de telefon sau avatarul.',
      },
      {
        q: 'Ce date personale stocați despre mine?',
        a: 'Găsești informații complete în Politica noastră de Confidențialitate.',
        link: { text: 'Vezi Politica de Confidențialitate →', href: '/confidentialitate' },
      },
    ],
  },
  {
    category: 'Plăți și Rambursări',
    items: [
      {
        q: 'Plata online cu cardul este sigură?',
        a: 'Da. Plățile online sunt procesate de operatori de plată autorizați și certificați. Nu stocăm datele cardului tău (număr, CVV, etc.).',
      },
      {
        q: 'Pot primi rambursare pentru o comandă?',
        a: 'Dacă comanda ta a fost incorectă sau nu a fost livrată, contactează-ne la 0725 635 020 sau renetrading@yahoo.com în aceeași zi. Vom analiza situația și vom oferi o soluție (rambursare sau comandă nouă).',
      },
      {
        q: 'Bonul fiscal îl primesc fizic sau digital?',
        a: 'Bonul comenzii tale este disponibil digital în Contul meu → Comenzile mele. Poți descărca PDF-ul oricând.',
      },
    ],
  },
];

export default function SupportPage() {
  return (
    <SiteLayout>
      <PageHero
        badge="Suport"
        title="Cum te putem ajuta?"
        subtitle="Echipa Rivers Lounge este aici pentru tine. Găsește răspunsuri rapide sau contactează-ne direct."
        backgroundImage="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1920&h=600&fit=crop"
      />

      {/* ── Contact cards ──────────────────────────────────────────────── */}
      <section className="py-14 border-b border-border">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Phone */}
            <div className="group rounded-2xl border border-border bg-card p-6 flex flex-col gap-4 hover:border-primary/40 transition-colors">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground mb-1">Sună-ne</p>
                <p className="text-lg font-bold text-primary">0725 635 020</p>
                <p className="text-xs text-muted-foreground mt-1">Luni – Duminică: 07:30 – 00:00</p>
              </div>
              <Button asChild size="sm" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                <a href="tel:0725635020">Sună acum</a>
              </Button>
            </div>

            {/* Email */}
            <div className="group rounded-2xl border border-border bg-card p-6 flex flex-col gap-4 hover:border-primary/40 transition-colors">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground mb-1">Scrie-ne</p>
                <p className="text-sm font-bold text-primary break-all">renetrading@yahoo.com</p>
                <p className="text-xs text-muted-foreground mt-1">Răspundem în maxim 24 ore</p>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full border-primary/30 hover:border-primary hover:bg-primary/10">
                <a href="mailto:renetrading@yahoo.com">Trimite email</a>
              </Button>
            </div>

            {/* WhatsApp */}
            <div className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-4 opacity-70">
              <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground mb-1">WhatsApp</p>
                <p className="text-sm text-muted-foreground">În curând disponibil</p>
                <p className="text-xs text-muted-foreground mt-1">Numărul va fi anunțat în curând</p>
              </div>
              {/* TODO: Replace button with href="https://wa.me/40XXXXXXXXX" when available */}
              <Button disabled size="sm" variant="outline" className="w-full cursor-not-allowed">
                În curând
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="py-16 border-b border-border">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <div className="mb-10 text-center">
            <span className="inline-block text-xs font-medium text-primary uppercase tracking-widest mb-3">
              Întrebări frecvente
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
              Găsește răspunsul rapid
            </h2>
          </div>

          <div className="space-y-8">
            {faqCategories.map((cat) => (
              <div key={cat.category}>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-primary mb-3 pl-1">
                  {cat.category}
                </h3>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <Accordion type="multiple">
                    {cat.items.map((item, idx) => (
                      <AccordionItem
                        key={idx}
                        value={`${cat.category}-${idx}`}
                        className="border-border px-5"
                      >
                        <AccordionTrigger className="text-foreground hover:no-underline hover:text-primary py-4">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pb-4">
                          {item.a}
                          {'link' in item && item.link && (
                            <Link
                              href={item.link.href}
                              className="block mt-2 text-primary hover:underline underline-offset-2 text-sm font-medium"
                            >
                              {item.link.text}
                            </Link>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact form ──────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-2xl px-4 lg:px-8">
          <div className="mb-8 text-center">
            <span className="inline-block text-xs font-medium text-primary uppercase tracking-widest mb-3">
              Formular de contact
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Nu ai găsit răspunsul? Scrie-ne
            </h2>
            <p className="text-muted-foreground">
              Completează formularul și îți răspundem în maxim 24 de ore.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 lg:p-8">
            <SupportContactForm />
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
