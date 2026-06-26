'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronRight, Utensils, CalendarDays, TreePine, ShoppingBag, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  heroImage?: string;
}

const DEFAULT_HERO = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&h=1080&fit=crop';

export function HeroSection({ heroImage }: HeroSectionProps) {
  const bgImage = heroImage || DEFAULT_HERO;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <style>{`
        @keyframes kenburns {
          0% { transform: scale(1.0); }
          100% { transform: scale(1.08); }
        }
        .hero-kenburns {
          animation: kenburns 8s ease-in-out infinite alternate;
        }
      `}</style>

      {/* Background with overlay */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat hero-kenburns"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.75) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.4) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.4) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)', pointerEvents: 'none' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-8 animate-fade-in-up">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium text-white/90">Bine ați venit la River&apos;s Lounge</span>
        </div>

        {/* Main heading */}
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 animate-fade-in-up text-balance" style={{ animationDelay: '0.1s' }}>
          Restaurant, Evenimente
          <br />
          <span className="text-primary">& Relaxare</span> în Călărași
        </h1>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-16 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <Link href="/meniu">
            <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-8">
              <ShoppingBag className="h-5 w-5" />
              Vezi Meniul
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/rezervari">
            <Button size="lg" variant="outline" className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/10 px-8">
              <CalendarDays className="h-5 w-5" />
              Rezervă Masă
            </Button>
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <FeatureCard
            icon={<Utensils className="h-6 w-6" />}
            title="Restaurant"
            description="Bucătărie tradițională și internațională într-un ambient elegant"
            href="/restaurant"
          />
          <FeatureCard
            icon={<ShoppingBag className="h-6 w-6" />}
            title="Comandă Acum"
            description="Comandă mâncare delicioasă direct la ușa ta"
            href="/meniu"
          />
          <FeatureCard
            icon={<CalendarDays className="h-6 w-6" />}
            title="Evenimente Private"
            description="Organizăm evenimentul tău perfect, de la A la Z"
            href="/rezervari"
          />
          <FeatureCard
            icon={<TreePine className="h-6 w-6" />}
            title="Cabana Rivers"
            description="Evenimente speciale și petreceri private în natură"
            href="/cabana"
          />
          <FeatureCard
            icon={<Sparkles className="h-6 w-6" />}
            title="River's Land"
            description="Loc de joacă și distracție pentru cei mici"
            href="/rivers-land"
          />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-primary/30 flex items-start justify-center p-1">
          <div className="w-1.5 h-3 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}

function FeatureCard({ icon, title, description, href }: FeatureCardProps) {
  return (
    <Link
      href={href}
      className="group relative p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/50 hover:bg-card/80 transition-all duration-300"
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
          {icon}
        </div>
        <h3 className="font-serif text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="h-5 w-5 text-primary" />
      </div>
    </Link>
  );
}
