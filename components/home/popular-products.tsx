'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Plus, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/cart-context';
import type { MenuProduct } from '@/lib/server-data';

interface PopularProductsProps {
  products: MenuProduct[];
}

export function PopularProducts({ products }: PopularProductsProps) {
  const { addItem } = useCart();
  const popularItems = products.filter((p) => p.popular && p.available).slice(0, 4);

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Comandă <span className="text-primary">Rapid</span>
            </h2>
            <p className="text-muted-foreground">
              Cele mai populare preparate, direct la tine acasă
            </p>
          </div>
          <Link href="/meniu">
            <Button variant="outline" className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/10">
              Vezi tot meniul
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularItems.map((product) => (
            <div
              key={product.id}
              className="group bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/50 transition-all duration-300"
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-medium">
                    <Star className="h-3 w-3 fill-current" />
                    Popular
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-serif text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xl font-bold text-primary">{product.price} lei</span>
                    {product.unit && <span className="block text-xs text-muted-foreground">/ {product.unit}</span>}
                  </div>
                  <Button
                    size="sm"
                    className="gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => addItem(product)}
                  >
                    <Plus className="h-4 w-4" />
                    Adaugă
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Delivery info */}
        <div className="mt-12 p-6 rounded-2xl bg-card/50 border border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                Livrare Gratuită în Călărași
              </h3>
              <p className="text-muted-foreground">
                Comandă minimă 50 lei. Livrăm și în Tonea (min. 150 lei) și Modelu (min. 200 lei).
              </p>
            </div>
            <Link href="/meniu">
              <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap">
                Comandă acum
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
