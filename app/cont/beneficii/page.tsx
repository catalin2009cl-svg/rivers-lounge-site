import Link from 'next/link';
import { SiteLayout } from '@/components/layout/site-layout';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Beneficii Membri | River's Lounge",
  description: "Programul de loialitate Rivers Lounge — în curând.",
};

export default function BeneficiiPage() {
  return (
    <SiteLayout>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        .gold-shimmer-text {
          background: linear-gradient(
            90deg,
            #8B6914 0%,
            #C9A84C 20%,
            #F5D98B 40%,
            #E8C55F 55%,
            #C9A84C 70%,
            #8B6914 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
        .teaser-card {
          transition: transform 0.3s ease, border-color 0.3s ease;
        }
        .teaser-card:hover {
          transform: translateY(-4px);
          border-color: rgba(201,168,76,0.35) !important;
        }
      `}</style>

      <div style={{ background: '#080808', minHeight: '100vh', paddingTop: '80px' }}>

        {/* Hero */}
        <div style={{
          position: 'relative',
          background: 'linear-gradient(180deg, #0F0A00 0%, #080808 100%)',
          padding: 'clamp(80px, 12vw, 120px) 24px clamp(60px, 8vw, 90px)',
          textAlign: 'center',
          overflow: 'hidden',
        }}>
          {/* Radial glow */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(201,168,76,0.09) 0%, transparent 70%)',
            animation: 'glow-pulse 4s ease-in-out infinite',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', maxWidth: '680px', margin: '0 auto' }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)',
              borderRadius: 999, padding: '6px 16px', marginBottom: 28,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9A84C', display: 'inline-block' }} />
              <span style={{ color: '#C9A84C', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                În pregătire
              </span>
            </div>

            <h1 style={{
              fontFamily: 'Georgia, serif',
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 700, marginBottom: 20, lineHeight: 1.15,
            }}>
              <span className="gold-shimmer-text">O experiență care</span>
              <br />
              <span style={{ color: '#F0EDE6' }}>merită răsplătită</span>
            </h1>

            <p style={{
              color: '#9A9490', fontSize: 17, lineHeight: 1.7,
              maxWidth: 520, margin: '0 auto 40px',
            }}>
              La Rivers Lounge, fiecare vizită contează. Pregătim un program special pentru cei care aleg să revină — pentru că loialitatea merită mai mult decât un simplu mulțumesc.
            </p>
          </div>
        </div>

        {/* Feature cards */}
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 64px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
            marginBottom: 56,
          }}>
            {[
              {
                icon: '🍽️',
                title: 'Momente speciale',
                desc: 'Recompense pentru experiențele trăite la noi',
              },
              {
                icon: '🥂',
                title: 'Fiecare vizită',
                desc: 'Contorizăm fiecare masă, nu doar comenzile online',
              },
              {
                icon: '🎭',
                title: 'Evenimente exclusive',
                desc: 'Acces prioritar la seri speciale și evenimente Rivers',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="teaser-card"
                style={{
                  background: 'rgba(201,168,76,0.04)',
                  border: '1px solid rgba(201,168,76,0.15)',
                  borderRadius: 16,
                  padding: '28px 24px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 14 }}>{card.icon}</div>
                <h3 style={{
                  color: '#F0EDE6', fontSize: 16, fontWeight: 700,
                  marginBottom: 8, fontFamily: 'Georgia, serif',
                }}>
                  {card.title}
                </h3>
                <p style={{ color: '#9A9490', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                  {card.desc}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center' }}>
            <Link href="/cont/inregistrare" style={{ textDecoration: 'none', display: 'block', marginBottom: 16 }}>
              <button style={{
                background: 'linear-gradient(135deg, #C9A84C, #A07830)',
                color: '#080808',
                border: 'none',
                borderRadius: 10,
                padding: '14px 36px',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.03em',
              }}>
                Creează cont gratuit
              </button>
            </Link>
            <p style={{ color: '#555', fontSize: 13, margin: 0 }}>
              Programul va fi disponibil în curând pentru toți membrii Rivers Lounge.
            </p>
          </div>
        </div>

      </div>
    </SiteLayout>
  );
}
