import { SiteLayout } from '@/components/layout/site-layout';
import { PageHero } from '@/components/layout/page-hero';
import { CookiePreferencesPanel } from '@/components/cookies/cookie-preferences-panel';
import { GdprRequestForm } from '@/components/cookies/gdpr-request-form';
import { Shield, BarChart2, Megaphone } from 'lucide-react';

export const metadata = {
  title: "Politica Cookies | River's Lounge",
  description: 'Informații despre utilizarea cookie-urilor pe riverslounge.ro și gestionarea preferințelor tale.',
};

const cookies = [
  {
    name: 'admin_session',
    type: 'Esențial',
    scope: 'Sesiune autentificare administrator',
    duration: '8 ore',
    provider: "Rivers Lounge",
  },
  {
    name: 'user_email',
    type: 'Esențial',
    scope: 'Sesiune cont client autentificat',
    duration: '30 zile',
    provider: "Rivers Lounge",
  },
  {
    name: 'rl_cookie_consent',
    type: 'Esențial',
    scope: 'Salvează preferințele tale de cookie-uri',
    duration: 'Permanent',
    provider: "Rivers Lounge",
  },
  {
    name: 'rivers-lounge-cart',
    type: 'Esențial',
    scope: 'Coș de cumpărături (localStorage)',
    duration: 'Sesiune browser',
    provider: "Rivers Lounge",
  },
  {
    name: 'rl-theme',
    type: 'Esențial',
    scope: 'Preferință temă interfață (light/dark)',
    duration: 'Permanent',
    provider: "Rivers Lounge",
  },
  {
    name: 'rl_admin_sound',
    type: 'Esențial',
    scope: 'Preferință sunet notificări admin (localStorage)',
    duration: 'Permanent',
    provider: "Rivers Lounge",
  },
  {
    name: 'rl_popup_seen',
    type: 'Funcțional',
    scope: 'Evită afișarea repetată a popup-ului promoțional',
    duration: 'Sesiune browser',
    provider: "Rivers Lounge",
  },
  {
    name: 'rl_daily_menu_dismissed',
    type: 'Funcțional',
    scope: 'Reține că ai închis bannerul meniului zilei',
    duration: 'Sesiune browser',
    provider: "Rivers Lounge",
  },
  {
    name: 'va_*',
    type: 'Analiză',
    scope: 'Statistici vizitatori anonime (pagini vizitate, dispozitiv)',
    duration: '365 zile',
    provider: 'Vercel Analytics',
  },
];

const typeColors: Record<string, string> = {
  'Esențial': 'bg-emerald-500/10 text-emerald-500',
  'Funcțional': 'bg-blue-500/10 text-blue-400',
  'Analiză': 'bg-amber-500/10 text-amber-400',
};

export default function CookiesPage() {
  return (
    <SiteLayout>
      <PageHero
        badge="Legal"
        title="Politica Cookies"
        subtitle="Ultima actualizare: iunie 2026"
        backgroundImage="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1920&h=600&fit=crop"
      />

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 lg:px-8 space-y-14">

          {/* Section 1 — Consent status */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Preferințele tale</h2>
            <CookiePreferencesPanel />
          </div>

          {/* Section 2 — Cookie table */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">2. Ce cookie-uri folosim</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tabelul de mai jos listează toate cookie-urile și datele stocate local de riverslounge.ro.
            </p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/60">
                    <th className="px-4 py-3 text-left font-medium text-foreground">Nume</th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">Tip</th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">Scop</th>
                    <th className="px-4 py-3 text-left font-medium text-foreground whitespace-nowrap">Durată</th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">Provider</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cookies.map((c) => (
                    <tr key={c.name} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-foreground whitespace-nowrap">{c.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[c.type] ?? ''}`}>
                          {c.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{c.scope}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{c.duration}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{c.provider}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3 — Category explanations */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">3. Explicații pe categorii</h2>

            <div className="rounded-xl border border-border bg-secondary/30 p-5 space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-500" />
                <h3 className="font-semibold text-foreground text-sm">Cookie-uri Esențiale (nu pot fi dezactivate)</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Necesare pentru funcționarea de bază a site-ului: autentificare, coș de cumpărături,
                preferințe interfață. Fără acestea, site-ul nu funcționează corect. Nu necesită
                consimțământ conform legislației GDPR.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-secondary/30 p-5 space-y-2">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-amber-400" />
                <h3 className="font-semibold text-foreground text-sm">Cookie-uri de Analiză</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ne ajută să înțelegem cum folosești site-ul pentru a-l îmbunătăți. Toate datele sunt
                anonime — nu colectăm informații personale.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mt-2 pl-1">
                <li><span className="text-foreground/70">Provider:</span> Vercel Analytics</li>
                <li><span className="text-foreground/70">Date colectate:</span> pagini vizitate, timp petrecut, tipul dispozitivului (anonim)</li>
                <li><span className="text-foreground/70">Date trimise în afara UE:</span> Nu (Vercel respectă GDPR)</li>
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-secondary/30 p-5 space-y-2">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-purple-400" />
                <h3 className="font-semibold text-foreground text-sm">Cookie-uri de Marketing</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Momentan nefolosite pe acest site. Dacă vom integra platforme de publicitate în viitor,
                această secțiune va fi actualizată și vei fi notificat.
              </p>
            </div>
          </div>

          {/* Section 4 — GDPR rights */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. Drepturile tale GDPR</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Conform Regulamentului General privind Protecția Datelor (GDPR — Regulamentul UE 2016/679),
              ai următoarele drepturi:
            </p>
            <ul className="space-y-3">
              {[
                ['Dreptul de acces', 'Poți solicita o copie a datelor personale pe care le deținem despre tine.'],
                ['Dreptul de rectificare', 'Poți solicita corectarea datelor incorecte sau incomplete.'],
                ['Dreptul de ștergere', 'Poți solicita ștergerea datelor tale personale ("dreptul de a fi uitat").'],
                ['Dreptul de portabilitate', 'Poți solicita datele tale într-un format structurat, lizibil automat.'],
                ['Dreptul de opoziție', 'Poți refuza prelucrarea datelor pentru scopuri de marketing sau analiză.'],
              ].map(([title, desc]) => (
                <li key={title} className="flex gap-3 text-sm">
                  <span className="text-primary mt-0.5">—</span>
                  <span className="text-muted-foreground">
                    <span className="text-foreground font-medium">{title}:</span> {desc}
                  </span>
                </li>
              ))}
            </ul>
            <GdprRequestForm />
          </div>

          {/* Section 5 — Browser settings */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Gestionarea din browser</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Pe lângă preferințele de mai sus, poți gestiona cookie-urile direct din setările browserului:
            </p>
            <ul className="space-y-1.5 text-sm text-muted-foreground pl-1">
              <li>Chrome: Setări → Confidențialitate și securitate → Cookie-uri</li>
              <li>Firefox: Opțiuni → Confidențialitate și securitate</li>
              <li>Safari: Preferințe → Confidențialitate</li>
              <li>Edge: Setări → Cookie-uri și permisiuni site</li>
            </ul>
            <p className="text-xs text-muted-foreground">
              Rețineți că dezactivarea cookie-urilor esențiale poate afecta funcționalitatea site-ului
              (ex: coșul de cumpărături, autentificarea).
            </p>
          </div>

        </div>
      </section>
    </SiteLayout>
  );
}
