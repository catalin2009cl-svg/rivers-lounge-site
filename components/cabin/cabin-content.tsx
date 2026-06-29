import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, TreePine, PartyPopper, Flame, Wifi, Users, Bed, Droplets, UtensilsCrossed, Car, Wind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cabinFeatures, cabinPackages, facilities } from '@/lib/mock-data';
import type { DbCabinPackage } from '@/lib/server-data';

const amenityIcons: Record<string, React.ReactNode> = {
  Capacitate:  <Users className="h-6 w-6" />,
  Dormitoare:  <Bed className="h-6 w-6" />,
  Băi:         <Droplets className="h-6 w-6" />,
  Bucătărie:   <UtensilsCrossed className="h-6 w-6" />,
  Grătar:      <Flame className="h-6 w-6" />,
  Parcare:     <Car className="h-6 w-6" />,
  WiFi:        <Wifi className="h-6 w-6" />,
  Climatizare: <Wind className="h-6 w-6" />,
};

interface CabinContentProps {
  featureImage?: string;
  packages?: DbCabinPackage[];
}

export function CabinContent({ featureImage, packages: dbPackages }: CabinContentProps) {
  const displayPackages = dbPackages && dbPackages.length > 0 ? dbPackages : cabinPackages;
  const cabin = facilities.find((f) => f.id === 'cabin')!;
  const imageSrc = featureImage || cabin.image;

  return (
    <>
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                <PartyPopper className="h-3 w-3 mr-1" />
                Evenimente & Petreceri Speciale
              </Badge>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Cabana Rivers — <span className="text-primary">Locul Perfect</span> pentru Evenimente
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">{cabin.description}</p>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Fie că planifici o petrecere tematică, un team building corporate, o aniversare sau un
                weekend de relaxare cu prietenii, Cabana Rivers oferă un cadru natural unic, complet
                echipat pentru evenimente memorabile.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/rezervari">
                  <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    Rezervă Cabana
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/10">
                    Solicită Ofertă
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative h-80 lg:h-[500px] rounded-2xl overflow-hidden border border-border">
              <Image src={imageSrc} alt="Cabana Rivers" fill className="object-cover" unoptimized={imageSrc.startsWith('/')} />
              <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur-sm rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <TreePine className="h-5 w-5" />
                  <span className="font-serif font-semibold">Cabana Rivers</span>
                </div>
                <p className="text-sm text-muted-foreground">{cabin.capacity}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-secondary/50">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold text-foreground mb-2">
              Pachete <span className="text-primary">Evenimente</span>
            </h2>
            <p className="text-muted-foreground">Alege pachetul potrivit pentru ocazia ta specială</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayPackages.map((pkg) => (
              <Card key={pkg.id} className="border-border hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="font-serif">{pkg.name}</CardTitle>
                    <Badge variant="secondary">{pkg.duration}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{pkg.description}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary mb-4">
                    de la {pkg.priceFrom} RON
                  </p>
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Include:</p>
                    <ul className="space-y-1">
                      {pkg.includes.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-primary shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mb-6">
                    <p className="text-sm font-medium mb-2">Ideal pentru:</p>
                    <div className="flex flex-wrap gap-2">
                      {pkg.idealFor.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Link href="/rezervari">
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      Rezervă Acest Pachet
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold text-foreground mb-2">
              Facilități <span className="text-primary">Cabana</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {cabinFeatures.map((feature) => (
              <Card key={feature.name} className="p-6 border-border text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                  {amenityIcons[feature.name] ?? <TreePine className="h-6 w-6" />}
                </div>
                <p className="text-[18px] font-semibold text-foreground leading-snug">{feature.name}</p>
                <p className="text-[14px] text-muted-foreground mt-2 leading-snug">{feature.value}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
