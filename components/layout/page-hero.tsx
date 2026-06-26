interface PageHeroProps {
  title: string;
  subtitle?: string;
  badge?: string;
  backgroundImage?: string;
}

export function PageHero({
  title,
  subtitle,
  badge,
  backgroundImage = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&h=600&fit=crop',
}: PageHeroProps) {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      <style>{`
        @keyframes ph-kenburns {
          0% { transform: scale(1.0); }
          100% { transform: scale(1.08); }
        }
        .ph-bg { animation: ph-kenburns 8s ease-in-out infinite alternate; }
      `}</style>
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat ph-bg"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.65) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)', pointerEvents: 'none' }} />
      </div>
      <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-8 text-center">
        {badge && (
          <span className="inline-block text-sm font-medium text-white/90 mb-4 px-4 py-1.5 rounded-full bg-white/10 border border-white/20">
            {badge}
          </span>
        )}
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 text-balance">
          {title}
        </h1>
        {subtitle && (
          <p className="max-w-2xl mx-auto text-lg text-white/80 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
