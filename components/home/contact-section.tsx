import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSettings } from '@/lib/server-data';

export async function ContactSection() {
  const settings = await getSettings();

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Map */}
          <div className="relative h-80 lg:h-full min-h-[400px] rounded-2xl overflow-hidden border border-border">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d683!2d27.3320657!3d44.1880948!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40b018779d22a8f5%3A0x39b3724ef68e193f!2sRiver's%20Lounge!5e0!3m2!1sro!2sro!4v1700000000000"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="River's Lounge Location"
              className="absolute inset-0"
            />
            <div className="absolute inset-0 bg-background/10 pointer-events-none" />
          </div>

          {/* Contact Info */}
          <div className="flex flex-col justify-center">
            <span className="inline-block text-sm font-medium text-primary mb-4">Contact</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-6">
              Ne Găsești <span className="text-primary">Aici</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Vizitează-ne pentru o experiență culinară de neuitat sau contactează-ne
              pentru rezervări și informații.
            </p>

            <div className="space-y-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Adresă</h3>
                  <p className="text-muted-foreground">{settings.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Telefon</h3>
                  <a
                    href={`tel:${settings.phone}`}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {settings.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Email</h3>
                  <a
                    href={`mailto:${settings.email}`}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {settings.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Program</h3>
                  <p className="text-muted-foreground">{settings.hours}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link href="/contact">
                <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  Contactează-ne
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/rezervari">
                <Button size="lg" variant="outline" className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/10">
                  Rezervă o Masă
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
