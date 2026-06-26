'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useCart } from '@/contexts/cart-context';
import { deliveryZones } from '@/lib/mock-data';
import { toast } from 'sonner';
import type { MenuProduct } from '@/lib/server-data';
import { DrinksUpsellModal } from '@/components/menu/drinks-upsell-modal';

interface MenuContentProps {
  products: MenuProduct[];
}

const SUBCATEGORIES: Record<string, { value: string; label: string }[]> = {
  all: [
    { value: 'specialitati', label: 'Specialități' },
    { value: 'bruschete', label: 'Bruschete' },
    { value: 'salate', label: 'Salate' },
    { value: 'supe', label: 'Supe' },
    { value: 'fel-principal', label: 'Fel Principal' },
    { value: 'pizza', label: 'Pizza' },
    { value: 'paste', label: 'Paste' },
    { value: 'fructe-de-mare', label: 'Fructe de Mare' },
    { value: 'platouri', label: 'Platouri Reci' },
    { value: 'focaccia-paine', label: 'Focaccia & Pâine' },
    { value: 'garnituri', label: 'Garnituri' },
    { value: 'sosuri', label: 'Sosuri' },
    { value: 'deserturi', label: 'Deserturi' },
    { value: 'bauturi', label: 'Băuturi' },
  ],
  food: [
    { value: 'specialitati', label: 'Specialități' },
    { value: 'bruschete', label: 'Bruschete' },
    { value: 'salate', label: 'Salate' },
    { value: 'supe', label: 'Supe' },
    { value: 'fel-principal', label: 'Fel Principal' },
    { value: 'pizza', label: 'Pizza' },
    { value: 'paste', label: 'Paste' },
    { value: 'fructe-de-mare', label: 'Fructe de Mare' },
    { value: 'platouri', label: 'Platouri Reci' },
    { value: 'focaccia-paine', label: 'Focaccia & Pâine' },
    { value: 'garnituri', label: 'Garnituri' },
    { value: 'sosuri', label: 'Sosuri' },
  ],
};

export function MenuContent({ products }: MenuContentProps) {
  const { items, addItem, updateQuantity, removeItem, totalItems, totalPrice } = useCart();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubcategory, setActiveSubcategory] = useState('all');
  const [showDrinksModal, setShowDrinksModal] = useState(false);

  const availableDrinks = products
    .filter((p) => p.category === 'drinks' && (p.status === 'disponibil' || (!p.status && p.available)))
    .slice(0, 6);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setActiveSubcategory('all');
  };

  const subcategories = SUBCATEGORIES[activeCategory] ?? [];

  // Show disponibil and indisponibil; hide retras and draft
  const visibleProducts = products.filter((p) => {
    const s = p.status ?? (p.available ? 'disponibil' : 'indisponibil');
    return s === 'disponibil' || s === 'indisponibil';
  });
  const filteredProducts = visibleProducts.filter((p) => {
    const catMatch = activeCategory === 'all' || p.category === activeCategory;
    const subcatMatch = activeSubcategory === 'all' || p.subcategory === activeSubcategory;
    return catMatch && subcatMatch;
  });

  const cartHasDrinks = items.some((i) => i.product.subcategory === 'bauturi');

  const handleOrder = () => {
    if (items.length === 0) return;
    if (!cartHasDrinks && availableDrinks.length > 0) {
      setShowDrinksModal(true);
    } else {
      router.push('/comanda/checkout');
    }
  };

  return (
    <>
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <Tabs value={activeCategory} onValueChange={handleCategoryChange}>
              <TabsList className="mb-4 flex-wrap h-auto gap-2 bg-secondary/50">
                <TabsTrigger value="all">Toate</TabsTrigger>
                <TabsTrigger value="food">Mâncare</TabsTrigger>
                <TabsTrigger value="drinks">Băuturi</TabsTrigger>
                <TabsTrigger value="desserts">Deserturi</TabsTrigger>
              </TabsList>

              {subcategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  <button
                    onClick={() => setActiveSubcategory('all')}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      activeSubcategory === 'all'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                    }`}
                  >
                    Toate
                  </button>
                  {subcategories.map((sub) => (
                    <button
                      key={sub.value}
                      onClick={() => setActiveSubcategory(sub.value)}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        activeSubcategory === sub.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}

              <TabsContent value={activeCategory} className="mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => {
                    const productStatus = product.status ?? (product.available ? 'disponibil' : 'indisponibil');
                    const isUnavailable = productStatus === 'indisponibil';
                    return (
                    <Card
                      key={product.id}
                      className={`overflow-hidden border-border transition-colors group ${isUnavailable ? 'opacity-75' : 'hover:border-primary/50'}`}
                    >
                      <div className="relative h-44">
                        <Image src={product.image} alt={product.name} fill className={`object-cover ${isUnavailable ? 'grayscale' : ''}`} />
                        {product.popular && !isUnavailable && (
                          <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                            Popular
                          </Badge>
                        )}
                        {isUnavailable && (
                          <>
                            <div className="absolute inset-0 bg-black/40" />
                            <Badge className="absolute top-3 right-3 bg-gray-800/90 text-gray-300 text-[10px] border-0">
                              Momentan indisponibil
                            </Badge>
                          </>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-serif font-semibold text-foreground">{product.name}</h3>
                          <span className={`font-bold shrink-0 ml-2 text-right ${isUnavailable ? 'text-muted-foreground' : 'text-primary'}`}>
                            {product.price} RON
                            {product.unit && <span className="block text-xs font-normal text-muted-foreground">/ {product.unit}</span>}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{product.description}</p>
                        <Button
                          size="sm"
                          disabled={isUnavailable}
                          className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => {
                            if (isUnavailable) return;
                            addItem(product);
                            toast.success(`${product.name} adăugat în coș`);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                          {isUnavailable ? 'Indisponibil' : 'Adaugă în coș'}
                        </Button>
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:w-80 shrink-0">
            <div className="sticky top-24">
              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-serif text-lg font-semibold flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                      Coșul tău
                    </h3>
                    <Badge variant="secondary">{totalItems} produse</Badge>
                  </div>

                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Coșul este gol. Adaugă produse din meniu.
                    </p>
                  ) : (
                    <>
                      <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                        {items.map((item) => (
                          <div key={item.product.id} className="flex gap-3 items-center">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                              <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.product.name}</p>
                              <p className="text-xs text-muted-foreground">{item.product.price} RON</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm w-6 text-center">{item.quantity}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive"
                                onClick={() => removeItem(item.product.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-border pt-4 mb-4">
                        <div className="flex justify-between font-semibold">
                          <span>Total</span>
                          <span className="text-primary">{totalPrice} RON</span>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={handleOrder}
                      >
                        Plasează Comanda
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border mt-4">
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold mb-3">Zone de livrare</h4>
                  <div className="space-y-2">
                    {deliveryZones.map((zone) => (
                      <div key={zone.name} className="flex justify-between text-xs text-muted-foreground">
                        <span>{zone.name}</span>
                        <span>min. {zone.minOrder} RON</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>

    <DrinksUpsellModal
      isOpen={showDrinksModal}
      drinks={availableDrinks}
      onClose={() => setShowDrinksModal(false)}
      onContinue={() => { setShowDrinksModal(false); router.push('/comanda/checkout'); }}
      onAddDrink={(drink) => {
        addItem(drink);
        setShowDrinksModal(false);
        router.push('/comanda/checkout');
      }}
    />
    </>
  );
}

export function MobileCartButton({ drinks = [] }: { drinks?: MenuProduct[] }) {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, addItem } = useCart();
  const router = useRouter();
  const [showDrinksModal, setShowDrinksModal] = useState(false);

  const cartHasDrinks = items.some((i) => i.product.subcategory === 'bauturi');

  function handleCheckout() {
    if (!cartHasDrinks && drinks.length > 0) {
      setShowDrinksModal(true);
    } else {
      router.push('/comanda/checkout');
    }
  }

  if (totalItems === 0) return null;

  return (
    <>
      <DrinksUpsellModal
        isOpen={showDrinksModal}
        drinks={drinks}
        onClose={() => setShowDrinksModal(false)}
        onContinue={() => { setShowDrinksModal(false); router.push('/comanda/checkout'); }}
        onAddDrink={(drink) => {
          addItem(drink);
          setShowDrinksModal(false);
          router.push('/comanda/checkout');
        }}
      />
      <Sheet>
        <SheetTrigger asChild>
          <Button className="fixed bottom-6 right-6 z-40 lg:hidden gap-2 shadow-lg bg-primary text-primary-foreground">
            <ShoppingBag className="h-4 w-4" />
            Coș ({totalItems})
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Coșul tău</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-sm text-muted-foreground">{item.product.price} RON x {item.quantity}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span>{item.quantity}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="border-t pt-4 flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-primary">{totalPrice} RON</span>
            </div>
            <Button className="w-full" onClick={handleCheckout}>Plasează Comanda</Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
