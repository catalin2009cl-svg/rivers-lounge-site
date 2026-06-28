'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  show: boolean;
  levelName: string;
  rewardValue?: number;
  onClose: () => void;
}

export function LevelUpModal({ show, levelName, rewardValue, onClose }: Props) {
  const [particles, setParticles] = useState<{ id: number; x: number; color: string; delay: number }[]>([]);

  useEffect(() => {
    if (show) {
      setParticles(
        Array.from({ length: 50 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          color: ['#C9A84C', '#F5D98B', '#E8C55F', '#fff', '#A07830'][Math.floor(Math.random() * 5)],
          delay: Math.random() * 2,
        }))
      );
    }
  }, [show]);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      {/* Confetti */}
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: '-10px',
            width: 8, height: 8,
            borderRadius: 2,
            background: p.color,
            animation: `confettiFall ${1.5 + p.delay}s ease-in forwards`,
            animationDelay: `${p.delay * 0.3}s`,
          }}
        />
      ))}

      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes scaleIn {
          0%   { transform: scale(0.7); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #1a1400 0%, #0F0A00 100%)',
          border: '1px solid rgba(201,168,76,0.4)',
          borderRadius: 20,
          padding: '40px 32px',
          maxWidth: 440,
          width: '100%',
          textAlign: 'center',
          animation: 'scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow: '0 0 60px rgba(201,168,76,0.2)',
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>

        <h2
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 22, fontWeight: 700, color: '#F0EDE6',
            marginBottom: 8,
          }}
        >
          Felicitări!
        </h2>
        <p
          style={{
            background: 'linear-gradient(90deg, #8B6914, #C9A84C, #F5D98B, #C9A84C, #8B6914)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: 18, fontWeight: 700,
            marginBottom: 12,
          }}
        >
          Ai atins {levelName}!
        </p>
        <p style={{ color: '#9A9490', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          {rewardValue
            ? `Ai deblocat recompensa de loialitate — o comandă gratuită de până la ${rewardValue} RON!`
            : 'Ai deblocat recompensa de loialitate Rivers Lounge!'}
        </p>

        <Button
          onClick={onClose}
          style={{
            background: 'linear-gradient(135deg, #C9A84C, #A07830)',
            color: '#080808',
            border: 'none',
            borderRadius: 10,
            padding: '12px 32px',
            fontSize: 15, fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Super, mulțumesc! 🙌
        </Button>
      </div>
    </div>
  );
}
