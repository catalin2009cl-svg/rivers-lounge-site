import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSpecialEvents, getUpcomingEvents, type SpecialEvent } from '@/lib/server-data';

const LOCATION_BADGE: Record<SpecialEvent['location'], string> = {
  'Restaurant':      'bg-blue-500/80 text-white',
  'Cabana Rivers':   'bg-green-600/80 text-white',
  "River's Land":    'bg-purple-500/80 text-white',
  "River's Marina":  'bg-teal-500/80 text-white',
  'Toate locațiile': 'bg-primary/90 text-primary-foreground',
};

interface CabinUpcomingEventsProps {
  filterLocation?: SpecialEvent['location'];
}

export async function CabinUpcomingEvents({ filterLocation }: CabinUpcomingEventsProps = {}) {
  const allEvents = await getSpecialEvents();
  const upcoming = getUpcomingEvents(allEvents).filter((e) =>
    !filterLocation ||
    e.location === filterLocation ||
    e.location === 'Toate locațiile'
  );

  if (upcoming.length === 0) return null;

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-2">
            Evenimente <span className="text-primary">Viitoare</span>
          </h2>
          <p className="text-muted-foreground">
            Rezervă-ți locul la evenimentele noastre speciale
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcoming.map((event) => (
            <article
              key={event.id}
              className="group bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/50 transition-all duration-300"
            >
              {event.image && (
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${LOCATION_BADGE[event.location] ?? LOCATION_BADGE['Toate locațiile']}`}>
                      {event.location}
                    </span>
                  </div>
                </div>
              )}
              <div className="p-6">
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(event.date).toLocaleDateString('ro-RO', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  {event.time && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {event.time}
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {event.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">
                  {event.description}
                </p>
                <Link href={event.ctaUrl || '/rezervari'}>
                  <Button size="sm" className="gap-1 bg-primary text-primary-foreground hover:bg-primary/90">
                    {event.ctaLabel || 'Rezervă locul'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
