import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram } from 'lucide-react';
import { SiteLogo } from '@/components/layout/site-logo';
import { CookieSettingsButton } from '@/components/cookies/cookie-settings-button';
import { getSettings } from '@/lib/server-data';
import { getSession } from '@/lib/auth';

const DEFAULT_LIGHT_SRC = '/uploads/1782418815754-6p2rttowpm3.png';

const footerLinks = {
  company: [
    { name: 'Despre Noi', href: '/despre' },
    { name: 'Restaurant', href: '/restaurant' },
    { name: 'Cabana Rivers', href: '/cabana' },
    { name: 'Cariere', href: '/cariere' },
  ],
  services: [
    { name: 'Meniu & Comenzi', href: '/meniu' },
    { name: 'Rezervări Evenimente', href: '/rezervari' },
    { name: 'Catering', href: '/catering' },
    { name: 'Beneficii Membri', href: '/cont/beneficii' },
    { name: 'Contact', href: '/contact' },
  ],
  legal: [
    { name: 'Termeni și Condiții', href: '/termeni' },
    { name: 'Politica de Confidențialitate', href: '/confidentialitate' },
    { name: 'Politica Cookies', href: '/cookies' },
    { name: 'ANPC', href: 'https://anpc.ro' },
  ],
};

export async function Footer() {
  const [settings, session] = await Promise.all([getSettings(), getSession()]);
  const branding = settings.branding;
  return (
    <footer className="bg-secondary border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Brand & Contact */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <SiteLogo
                lightSrc={branding?.logoLight ?? DEFAULT_LIGHT_SRC}
                darkSrc={branding?.logoDark || null}
                width={branding?.logoWidth ?? 140}
                height={branding?.logoHeight ?? 44}
              />
            </Link>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Restaurant, evenimente și relaxare în inima Călărașiului. 
              Experiențe culinare de neuitat într-un ambient elegant.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span>{settings.address}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <a href={`tel:${settings.phone}`} className="hover:text-primary transition-colors">
                  {settings.phone}
                </a>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <a href={`mailto:${settings.email}`} className="hover:text-primary transition-colors">
                  {settings.email}
                </a>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <p>{settings.hours}</p>
              </div>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Companie</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Servicii</h3>
            <ul className="space-y-2">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Social */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2 mb-6">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
              <li>
                <CookieSettingsButton />
              </li>
            </ul>
            
            <h3 className="text-sm font-semibold text-foreground mb-3">Urmărește-ne</h3>
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/riverslounge"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-muted hover:bg-primary/20 hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/riverslounge"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-muted hover:bg-primary/20 hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} River&apos;s Lounge. Toate drepturile rezervate.
            </p>
            <div className="flex items-center gap-4">
              <p className="text-xs text-muted-foreground">
                Realizat cu ❤️ în Călărași
              </p>
              {session ? (
                <Link
                  href="/admin"
                  className="text-[12px] text-[#9A9490] border border-[#2E2E2E] rounded-md px-2.5 py-1 whitespace-nowrap transition-colors duration-200 hover:text-[#C9A84C] hover:border-[#C9A84C]"
                >
                  ⚙️ Administrare platformă
                </Link>
              ) : (
                <Link
                  href="/admin/login"
                  className="text-[11px] text-[#2E2E2E] transition-colors duration-200 hover:text-[#9A9490]"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
