'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface CelebrationProps {
  show: boolean;
  freeCode: string;
  onClose: () => void;
  levelName?: string;
  discountPercent?: number;
  maxOrderValue?: number;
}

// Deterministic particle data — avoids hydration mismatch from Math.random()
const PARTICLE_COLORS = ['#C9A84C', '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#DDA0DD', '#96CEB4', '#FFEAA7'];
const PARTICLES = Array.from({ length: 60 }, (_, i) => ({
  color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
  left: ((i * 1.67) % 100).toFixed(2),
  width: 6 + (i % 5) * 2,
  height: 6 + (i % 7) * 1.5,
  circle: i % 3 === 0,
  duration: (2 + (i % 4) * 0.7).toFixed(1),
  delay: ((i * 0.09) % 2.8).toFixed(2),
}));

export function Celebration({ show, freeCode, onClose, levelName, discountPercent, maxOrderValue }: CelebrationProps) {
  const [copied, setCopied] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => onCloseRef.current(), 10000);
    return () => clearTimeout(t);
  }, [show]);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(freeCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [freeCode]);

  if (!show) return null;

  const isLevel = !!levelName;

  return (
    <>
      <style>{`
        @keyframes particleFall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(100vh)  rotate(720deg); opacity: 0; }
        }
        @keyframes shimmerText {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes scaleIn {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1);   }
        }
        @keyframes codeBounce {
          0%, 100% { transform: translateY(0);   }
          50%       { transform: translateY(-6px); }
        }
      `}</style>

      {/* Layer 1 — Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          zIndex: 99998,
          background: 'rgba(0,0,0,0.88)',
        }}
      />

      {/* Layer 2 — Confetti particles */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'fixed',
            top: 0,
            left: `${p.left}%`,
            width: p.width,
            height: p.height,
            background: p.color,
            borderRadius: p.circle ? '50%' : 2,
            animation: `particleFall ${p.duration}s ${p.delay}s ease-in infinite`,
            zIndex: 99999,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Layer 3 — Modal card */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 100000,
          background: 'linear-gradient(135deg, #1A1A1A, #0F0F0F)',
          border: '2px solid #C9A84C',
          borderRadius: 24,
          padding: '48px 40px',
          maxWidth: 460, width: '90vw',
          textAlign: 'center',
          animation: 'scaleIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275) forwards',
          boxShadow: '0 0 60px rgba(201,168,76,0.5), 0 0 120px rgba(201,168,76,0.2)',
        }}
      >
        {/* Trophy */}
        <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 16 }}>🏆</div>

        {/* Shimmer title */}
        <h1 style={{
          fontSize: 48, fontWeight: 900, letterSpacing: 5,
          textTransform: 'uppercase', marginBottom: 8,
          background: 'linear-gradient(90deg, #C9A84C, #FFD700, #C9A84C, #FFD700)',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'shimmerText 2s linear infinite',
        }}>
          BONUS!
        </h1>

        {isLevel ? (
          <>
            <h2 style={{ fontSize: 18, color: '#FFFFFF', fontWeight: 700, marginBottom: 6 }}>
              Ai atins nivelul &ldquo;{levelName}&rdquo;! 🎉
            </h2>
            <p style={{ color: '#9A9490', fontSize: 14, marginBottom: 28, lineHeight: 1.7 }}>
              Ca recompensă pentru loialitatea ta,<br />
              <strong style={{ color: '#C9A84C' }}>
                {discountPercent}% reducere la comenzi de maximum {maxOrderValue} RON
              </strong>
            </p>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 20, color: '#FFFFFF', fontWeight: 700, marginBottom: 8 }}>
              Felicitări! Ai atins 10 comenzi! 🎉
            </h2>
            <p style={{ color: '#9A9490', fontSize: 14, marginBottom: 28, lineHeight: 1.7 }}>
              Ca recompensă pentru loialitatea ta,<br />
              <strong style={{ color: '#C9A84C' }}>
                următoarea ta comandă este complet gratuită!
              </strong>
            </p>
          </>
        )}

        {/* Code box */}
        <div style={{
          background: '#0F0F0F',
          border: '1px dashed #C9A84C',
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 20,
          animation: 'codeBounce 2s ease-in-out infinite',
        }}>
          <p style={{ color: '#9A9490', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
            Codul tău
          </p>
          <p style={{
            color: '#C9A84C', fontSize: 28, fontWeight: 900,
            fontFamily: 'monospace', letterSpacing: 5, margin: 0,
          }}>
            {freeCode}
          </p>
          <p style={{ color: '#555', fontSize: 11, marginTop: 8 }}>
            {isLevel ? 'Valabil 30 de zile · Folosește-l la checkout' : 'Folosește-l la următoarea comandă'}
          </p>
        </div>

        {/* Copy button */}
        <button
          onClick={copy}
          style={{
            width: '100%',
            background: copied ? 'rgba(74,222,128,0.15)' : '#C9A84C',
            color: copied ? '#4ADE80' : '#0F0F0F',
            border: copied ? '1px solid rgba(74,222,128,0.4)' : 'none',
            borderRadius: 10, padding: '14px 0',
            fontSize: 16, fontWeight: 700, cursor: 'pointer',
            marginBottom: 12, transition: 'all 0.2s',
          }}
        >
          {copied ? '✓ Copiat!' : '📋 Copiază codul'}
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            background: 'transparent', color: '#9A9490',
            border: 'none', fontSize: 13, cursor: 'pointer',
            textDecoration: 'underline', display: 'block',
            width: '100%', textAlign: 'center',
          }}
        >
          Continuă →
        </button>

        <p style={{ color: '#2E2E2E', fontSize: 11, marginTop: 12 }}>
          Se închide automat în 10 secunde
        </p>
      </div>
    </>
  );
}
