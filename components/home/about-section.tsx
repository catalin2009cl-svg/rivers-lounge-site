import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Utensils, Wine, Users, TreePine } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: <Utensils className="h-6 w-6" />,
    title: 'Bucătărie Rafinată',
    description: 'Preparate tradiționale și internaționale, create cu ingrediente proaspete și multă pasiune.',
  },
  {
    icon: <Wine className="h-6 w-6" />,
    title: 'Bar Premium',
    description: 'Selecție variată de vinuri, cocktailuri și băuturi pentru toate gusturile.',
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Evenimente Private',
    description: 'Spații dedicate pentru petreceri, nunți, botezuri și evenimente corporate.',
  },
  {
    icon: <TreePine className="h-6 w-6" />,
    title: 'Cabana Rivers',
    description: 'Evadare în natură pentru weekend-uri de relaxare și distracție.',
  },
];

export function AboutSection() {
  return (
    <section className="py-20 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image Grid */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="relative h-40 rounded-2xl overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop"
                    alt="Restaurant interior"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="relative h-56 rounded-2xl overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=400&fit=crop"
                    alt="Preparate culinare"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="relative h-56 rounded-2xl overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop"
                    alt="Ambient restaurant"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="relative h-40 rounded-2xl overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&h=300&fit=crop"
                    alt="Cabana Rivers"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-6 -right-6 lg:bottom-8 lg:right-8 bg-primary text-primary-foreground p-6 rounded-2xl shadow-xl">
              <div className="text-center">
                <span className="block text-4xl font-bold font-serif">10+</span>
                <span className="text-sm">Ani de Experiență</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            <span className="inline-block text-sm font-medium text-primary mb-4">Despre Noi</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-6 text-balance">
              O Experiență Culinară <span className="text-primary">de Neuitat</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              De peste un deceniu, River&apos;s Lounge este destinația preferată pentru cei care 
              apreciază mâncarea delicioasă și atmosfera rafinată. Situat în inima Călărașiului, 
              restaurantul nostru combină tradițiile culinare românești cu influențe internaționale 
              moderne.
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-wrap gap-4">
              <Link href="/restaurant">
                <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  Descoperă Restaurantul
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/cabana">
                <Button size="lg" variant="outline" className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/10">
                  Vezi Cabana Rivers
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
