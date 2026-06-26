import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, MapPin, ArrowRight, ArrowLeft } from 'lucide-react';
import { SiteLayout } from '@/components/layout/site-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getSpecialEvents } from '@/lib/server-data';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const events = await getSpecialEvents();
  const event = events.find((e) => e.id === id);
  if (!event) return { title: "Eveniment | River's Lounge" };
  return {
    title: `${event.title} | River's Lounge`,
    description: event.description,
    openGraph: {
      title: event.title,
      description: event.description,
      images: event.image ? [{ url: event.image, width: 1200, height: 630 }] : [],
      type: 'article',
      locale: 'ro_RO',
    },
  };
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const events = await getSpecialEvents();
  const event = events.find((e) => e.id === id);

  if (!event) {
    return (
      <SiteLayout>
        <section className="py-20 text-center">
          <p className="text-muted-foreground mb-4">Evenimentul nu a fost găsit.</p>
          <Link href="/cabana">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Înapoi la cabană
            </Button>
          </Link>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <article className="py-12">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <Link href="/cabana">
            <Button variant="ghost" className="gap-2 mb-6 -ml-2">
              <ArrowLeft className="h-4 w-4" />
              Înapoi la evenimente
            </Button>
          </Link>

          <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
            {event.location}
          </Badge>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {event.title}
          </h1>

          <div className="flex flex-wrap gap-4 text-muted-foreground mb-8">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              {new Date(event.date).toLocaleDateString('ro-RO', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            {event.time && (
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                {event.time}
              </span>
            )}
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              {event.location}
            </span>
          </div>

          {event.image && (
            <div className="relative h-64 sm:h-96 rounded-2xl overflow-hidden border border-border mb-8">
              <Image src={event.image} alt={event.title} fill className="object-cover" />
            </div>
          )}

          <div className="mb-8">
            {event.description.split('\n').map((line, i) => (
              <p key={i} className="text-muted-foreground leading-relaxed text-lg mb-3">
                {line}
              </p>
            ))}
          </div>

          {event.ctaUrl && (
            <Link href={event.ctaUrl}>
              <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                {event.ctaLabel || 'Rezervă locul'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </article>
    </SiteLayout>
  );
}
