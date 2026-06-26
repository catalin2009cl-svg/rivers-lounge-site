'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Users, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { facilities, products } from '@/lib/mock-data';

export function RestaurantContent() {
  const restaurant = facilities.find((f) => f.id === 'restaurant')!;
  const popularDishes = products.filter((p) => p.popular).slice(0, 4);

  return (
    <>
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-80 lg:h-[480px] rounded-2xl overflow-hidden border border-border">
              <Image src={restaurant.image} alt={restaurant.name} fill className="object-cover" />
            </div>
            <div>
              <h2 className="font-serif text-3xl font-bold text-foreground mb-4">
                Ambient <span className="text-primary">Premium</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">{restaurant.description}</p>
              <ul className="grid grid-cols-2 gap-3 mb-8">
                {restaurant.highlights.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-4">
                <Link href="/meniu">
                  <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    Vezi Meniul Complet
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/rezervari">
                  <Button variant="outline" className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/10">
                    Rezervă Masă
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-secondary/50">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold text-foreground mb-2">
              Preparate <span className="text-primary">Populare</span>
            </h2>
            <p className="text-muted-foreground">Cele mai apreciate preparate de clienții noștri</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularDishes.map((dish) => (
              <Card key={dish.id} className="overflow-hidden border-border hover:border-primary/50 transition-colors">
                <div className="relative h-40">
                  <Image src={dish.image} alt={dish.name} fill className="object-cover" />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-serif font-semibold text-foreground mb-1">{dish.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{dish.description}</p>
                  <p className="text-primary font-semibold">{dish.price} RON</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 border-border text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-serif text-xl font-semibold mb-2">Capacitate</h3>
              <p className="text-muted-foreground">{restaurant.capacity}</p>
            </Card>
            <Card className="p-6 border-border text-center">
              <Clock className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-serif text-xl font-semibold mb-2">Program</h3>
              <p className="text-muted-foreground">L-V: 11:00 - 23:00<br />S-D: 10:00 - 00:00</p>
            </Card>
            <Card className="p-6 border-border text-center">
              <Star className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-serif text-xl font-semibold mb-2">Experiență</h3>
              <p className="text-muted-foreground">Peste 10 ani de excelență culinară</p>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
