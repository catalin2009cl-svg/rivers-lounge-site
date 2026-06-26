import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { facilities } from '@/lib/mock-data';

interface FacilitiesOverviewProps {
  cardImages?: Record<string, string>;
}

export function FacilitiesOverview({ cardImages }: FacilitiesOverviewProps = {}) {
  return (
    <section className="py-16 bg-secondary/50">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-2">
            Platforma <span className="text-primary">River&apos;s Lounge</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Toate facilitățile noastre într-un singur loc — restaurant, comenzi online, evenimente, Cabana Rivers și River&apos;s Marina
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {facilities.map((facility) => (
            <Link key={facility.id} href={facility.href} className="group">
              <Card className="overflow-hidden border-border hover:border-primary/50 transition-all h-full">
                <div className="relative h-40">
                  <Image src={cardImages?.[facility.id] || facility.image} alt={facility.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-serif font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {facility.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{facility.shortDescription}</p>
                  <span className="inline-flex items-center gap-1 text-sm text-primary mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    Explorează <ArrowRight className="h-3 w-3" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
