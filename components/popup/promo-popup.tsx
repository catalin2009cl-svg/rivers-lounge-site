'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';
import type { PopupConfig } from '@/lib/server-data';

// ── Type config ───────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  promo:        { icon: '🏷️', label: 'PROMOȚIE',  badgeBg: 'rgba(239,68,68,0.2)',  badgeColor: '#F87171' },
  event:        { icon: '🎉', label: 'EVENIMENT', badgeBg: 'rgba(139,92,246,0.2)', badgeColor: '#A78BFA' },
  seasonal:     { icon: '🌟', label: 'SEZONIER',  badgeBg: 'rgba(34,197,94,0.2)',  badgeColor: '#4ADE80' },
  announcement: { icon: '📢', label: 'ANUNȚ',     badgeBg: 'rgba(59,130,246,0.2)', badgeColor: '#60A5FA' },
} as const;

// Particle positions: [bottom%, left%] of the card wrapper
const PARTICLE_POSITIONS: [string, string][] = [
  ['100%', '15%'],   // bottom-left
  ['100%', '50%'],   // bottom-center
  ['100%', '85%'],   // bottom-right
  ['0%',   '5%'],    // top-left
  ['0%',   '95%'],   // top-right
  ['50%',  '0%'],    // left-center
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface PromoPopupProps {
  popup: PopupConfig;
  preview?: boolean;
}

// ── Keyframes (injected once, live mode only) ─────────────────────────────────

const KEYFRAMES = `
  @keyframes shimmerSweep {
    0%          { transform: translateX(-100%); }
    30%, 100%   { transform: translateX(350%); }
  }
  @keyframes floatParticle0 { 0%,100% { transform:translate(0,0) scale(1);   opacity:.8; } 50% { transform:translate(10px,-20px)  scale(.5); opacity:0; } }
  @keyframes floatParticle1 { 0%,100% { transform:translate(0,0) scale(1);   opacity:.6; } 50% { transform:translate(-15px,-25px) scale(.3); opacity:0; } }
  @keyframes floatParticle2 { 0%,100% { transform:translate(0,0) scale(.8);  opacity:.9; } 50% { transform:translate(5px,-30px)   scale(.2); opacity:0; } }
  @keyframes floatParticle3 { 0%,100% { transform:translate(0,0) scale(1);   opacity:.7; } 50% { transform:translate(-10px,-20px) scale(.4); opacity:0; } }
  @keyframes floatParticle4 { 0%,100% { transform:translate(0,0) scale(.9);  opacity:.8; } 50% { transform:translate(8px,-15px)   scale(.3); opacity:0; } }
  @keyframes floatParticle5 { 0%,100% { transform:translate(0,0) scale(1);   opacity:.5; } 50% { transform:translate(-5px,-25px)  scale(.5); opacity:0; } }
`;

// ── Card ──────────────────────────────────────────────────────────────────────

export function PopupCard({ popup, onClose, preview = false }: {
  popup: PopupConfig;
  onClose?: () => void;
  preview?: boolean;
}) {
  const typeCfg = TYPE_CONFIG[popup.type ?? 'promo'];
  const hasCTA = popup.ctaLabel?.trim() && popup.ctaUrl?.trim();
  const hasSecondaryCTA = popup.ctaSecondaryLabel?.trim() && popup.ctaSecondaryUrl?.trim();
  const accent = popup.accentColor || '#C9A84C';
  const bg = popup.backgroundColor || '#1A1A1A';

  return (
    <>
      {!preview && <style>{KEYFRAMES}</style>}

      {/* Outer wrapper — position:relative + overflow:visible so particles can escape */}
      <div style={{ position: 'relative', width: '100%', maxWidth: preview ? '100%' : 480 }}>

        {/* Floating gold particles (live only) */}
        {!preview && PARTICLE_POSITIONS.map(([top, left], i) => (
          <div key={i} style={{
            position: 'absolute',
            top, left,
            width: 6, height: 6,
            borderRadius: '50%',
            background: '#C9A84C',
            boxShadow: '0 0 8px rgba(201,168,76,0.8)',
            animation: `floatParticle${i} ${3 + i * 0.5}s ease-in-out infinite`,
            zIndex: 2,
            transform: 'translate(-50%, -50%)',
          }} />
        ))}

        {/* Card */}
        <div style={{
          background: bg,
          borderRadius: 16,
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
          border: preview ? 'none' : '1px solid rgba(201,168,76,0.3)',
          boxShadow: preview
            ? 'none'
            : '0 0 20px rgba(201,168,76,0.12), 0 30px 60px rgba(0,0,0,0.7)',
        }}>

          {/* Shimmer sweep overlay (live only) */}
          {!preview && (
            <div style={{
              position: 'absolute', inset: 0,
              borderRadius: 'inherit',
              overflow: 'hidden',
              pointerEvents: 'none',
              zIndex: 1,
            }}>
              <div style={{
                position: 'absolute',
                top: '-50%', left: '-75%',
                width: '50%', height: '200%',
                background: 'linear-gradient(105deg, transparent 40%, rgba(201,168,76,0.15) 50%, transparent 60%)',
                animation: 'shimmerSweep 4s ease-in-out infinite',
              }} />
            </div>
          )}

          {/* Accent top bar */}
          <div style={{ height: 6, background: accent }} />

          {/* Image */}
          {popup.image && (
            <div style={{ position: 'relative', width: '100%', height: 200 }}>
              <Image src={popup.image} alt={popup.title || 'Popup'} fill className="object-cover" />
            </div>
          )}

          {/* Body */}
          <div style={{ padding: preview ? '16px 20px 20px' : '20px 24px 24px', position: 'relative', zIndex: 2 }}>
            {/* Type badge */}
            <div style={{ marginBottom: 12 }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                padding: '4px 10px',
                borderRadius: 999,
                background: typeCfg.badgeBg,
                color: typeCfg.badgeColor,
              }}>
                {typeCfg.icon} {popup.badgeText?.trim() || typeCfg.label}
              </span>
            </div>

            {/* Title */}
            {popup.title?.trim() && (
              <h2 style={{
                fontSize: preview ? 18 : 22,
                fontWeight: 700,
                color: '#F0EDE6',
                marginBottom: 6,
                lineHeight: 1.25,
                fontFamily: 'var(--font-playfair, Georgia, serif)',
              }}>
                {popup.title}
              </h2>
            )}

            {/* Subtitle */}
            {popup.subtitle?.trim() && (
              <p style={{ fontSize: 13, fontWeight: 600, color: accent, marginBottom: 8 }}>
                {popup.subtitle}
              </p>
            )}

            {/* Description */}
            {popup.description?.trim() && (
              <p style={{ fontSize: 13, color: '#9A9490', marginBottom: 18, lineHeight: 1.6 }}>
                {popup.description}
              </p>
            )}

            {/* CTAs */}
            {(hasCTA || hasSecondaryCTA) && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                {hasCTA && (
                  preview ? (
                    <span style={{
                      flex: 1, minWidth: 100, textAlign: 'center', padding: '9px 16px',
                      borderRadius: 10, background: accent, color: '#0F0F0F',
                      fontWeight: 700, fontSize: 13, display: 'block',
                    }}>
                      {popup.ctaLabel}
                    </span>
                  ) : (
                    <Link href={popup.ctaUrl} onClick={onClose} style={{
                      flex: 1, minWidth: 100, textAlign: 'center', padding: '10px 18px',
                      borderRadius: 10, background: accent, color: '#0F0F0F',
                      fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'block',
                    }}>
                      {popup.ctaLabel}
                    </Link>
                  )
                )}
                {hasSecondaryCTA && (
                  preview ? (
                    <span style={{
                      flex: 1, minWidth: 100, textAlign: 'center', padding: '9px 16px',
                      borderRadius: 10, border: `1.5px solid ${accent}55`,
                      color: '#F0EDE6', fontWeight: 600, fontSize: 13, display: 'block',
                    }}>
                      {popup.ctaSecondaryLabel}
                    </span>
                  ) : (
                    <Link href={popup.ctaSecondaryUrl} onClick={onClose} style={{
                      flex: 1, minWidth: 100, textAlign: 'center', padding: '10px 18px',
                      borderRadius: 10, border: `1.5px solid ${accent}55`,
                      color: '#F0EDE6', fontWeight: 600, fontSize: 13, textDecoration: 'none', display: 'block',
                    }}>
                      {popup.ctaSecondaryLabel}
                    </Link>
                  )
                )}
              </div>
            )}

            {/* Close text link */}
            {!preview && (
              <button onClick={onClose} style={{
                display: 'block', width: '100%', textAlign: 'center',
                marginTop: 14, fontSize: 12, color: '#9A9490',
                background: 'none', border: 'none', cursor: 'pointer',
              }}>
                Închide
              </button>
            )}
          </div>

          {/* × button */}
          {!preview && (
            <button
              onClick={onClose}
              aria-label="Închide"
              style={{
                position: 'absolute', top: 14, right: 14,
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#F0EDE6',
                zIndex: 3,
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ── Full popup with backdrop ──────────────────────────────────────────────────

export function PromoPopup({ popup, preview = false }: PromoPopupProps) {
  const [visible, setVisible] = useState(preview);
  const [entered, setEntered] = useState(preview);

  useEffect(() => {
    if (preview) return;
    if (!popup.enabled) return;

    if (popup.expiresAt && new Date(popup.expiresAt) < new Date()) return;

    if (popup.showOnce && popup.createdAt) {
      const seen = localStorage.getItem('rl_popup_seen');
      if (seen === popup.createdAt) return;
    }

    const timer = setTimeout(() => {
      setVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    }, Math.max(0, (popup.showDelay ?? 3)) * 1000);

    return () => clearTimeout(timer);
  }, [popup, preview]);

  function handleClose() {
    if (!preview && popup.showOnce && popup.createdAt) {
      localStorage.setItem('rl_popup_seen', popup.createdAt);
    }
    setEntered(false);
    setTimeout(() => setVisible(false), 300);
  }

  if (preview) {
    return <PopupCard popup={popup} preview />;
  }

  if (!visible) return null;

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'radial-gradient(ellipse 600px 400px at center, rgba(201,168,76,0.05) 0%, transparent 60%), rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        opacity: entered ? 1 : 0,
        transition: 'opacity 0.3s ease, backdrop-filter 0.3s ease',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          transform: entered ? 'scale(1)' : 'scale(0.9)',
          opacity: entered ? 1 : 0,
          transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
        }}
      >
        <PopupCard popup={popup} onClose={handleClose} />
      </div>
    </div>
  );
}
