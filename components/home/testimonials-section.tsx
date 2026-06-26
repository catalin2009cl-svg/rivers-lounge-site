import { Star, Quote } from 'lucide-react';
import { getReviews } from '@/lib/server-data';
import Image from 'next/image';

const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/place/River's+Lounge/@44.1880948,27.3320657,683m/data=!3m1!1e3!4m6!3m5!1s0x40b018779d22a8f5:0x39b3724ef68e193f!8m2!3d44.1880131!4d27.3343935!16s%2Fg%2F1jkwnv7sz";

const GOOGLE_REVIEW_URL =
  "https://www.google.com/maps/place/River's+Lounge/@44.1880948,27.3320657,683m/data=!3m1!1e3!4m6!3m5!1s0x40b018779d22a8f5:0x39b3724ef68e193f!8m2!3d44.1880131!4d27.3343935!16s%2Fg%2F1jkwnv7sz";

export async function TestimonialsSection() {
  const allReviews = await getReviews();
  const reviews = allReviews.filter((r) => r.approved && r.featured);

  if (reviews.length === 0) return null;

  return (
    <section className="py-20 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-medium text-primary mb-4">Testimoniale</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ce Spun <span className="text-primary">Clienții</span> Noștri
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experiențele autentice ale celor care ne-au vizitat
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-card rounded-2xl border border-border p-6 hover:border-primary/50 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Quote className="h-5 w-5 text-primary" />
              </div>

              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating ? 'text-primary fill-primary' : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>

              <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-4">
                &ldquo;{review.text}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                  {review.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{review.name}</p>
                  <p className="text-xs text-muted-foreground">{review.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Google Reviews CTA */}
        <div style={{
          textAlign: 'center',
          marginTop: '40px',
          padding: '32px',
          background: '#1A1A1A',
          borderRadius: '12px',
          border: '1px solid #2E2E2E',
        }}>
          {/* Rating row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '16px',
            flexWrap: 'wrap',
          }}>
            <Image
              src="https://www.google.com/favicon.ico"
              alt="Google"
              width={24}
              height={24}
              unoptimized
            />
            <span style={{ color: '#F0EDE6', fontSize: '18px', fontWeight: 700 }}>4.8</span>
            <div style={{ color: '#FBBF24', fontSize: '20px' }}>★★★★★</div>
            <span style={{ color: '#9A9490', fontSize: '14px' }}>(bazat pe recenziile Google)</span>
          </div>

          <p style={{ color: '#9A9490', fontSize: '14px', marginBottom: '20px' }}>
            Citește toate recenziile clienților noștri pe Google Maps
          </p>

          {/* Buttons row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#FFFFFF',
                color: '#0F0F0F',
                padding: '12px 28px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '15px',
              }}
            >
              <Image
                src="https://www.google.com/favicon.ico"
                width={18}
                height={18}
                alt="Google"
                unoptimized
              />
              Vezi toate recenziile pe Google
            </a>

            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'transparent',
                color: '#C9A84C',
                border: '1px solid #C9A84C',
                padding: '10px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              ⭐ Lasă o recenzie
            </a>
          </div>

          <p style={{ color: '#4E4E4E', fontSize: '12px', marginTop: '16px' }}>
            Lasă și tu o recenzie — ne ajuți să creștem! ⭐
          </p>
        </div>
      </div>
    </section>
  );
}
