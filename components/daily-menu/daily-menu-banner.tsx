'use client';

import { useState, useEffect } from 'react';
import type { DailyMenuBannerData } from '@/lib/server-data';

const DISMISSED_KEY = 'rl_daily_menu_dismissed';

interface Props {
  data: DailyMenuBannerData;
  preview?: boolean;
}

export function DailyMenuBanner({ data, preview = false }: Props) {
  const [cardState, setCardState] = useState<'visible' | 'minimized' | 'dismissed'>(
    preview ? 'visible' : 'dismissed'
  );
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (preview) return;
    try {
      if (sessionStorage.getItem(DISMISSED_KEY) === new Date().toDateString()) return;
    } catch { /* private mode */ }
    setCardState('visible');
  }, [preview]);

  function dismiss() {
    if (preview) return;
    try { sessionStorage.setItem(DISMISSED_KEY, new Date().toDateString()); } catch { /* ignore */ }
    setCardState('dismissed');
  }

  if (cardState === 'dismissed') return null;

  const isMeniu = data.type === 'meniu-zilei';
  const icon = isMeniu ? '🍽️' : '☀️';
  const typeLabel = isMeniu ? 'Meniu Zilei' : 'Mic Dejun Rivers';

  if (cardState === 'minimized') {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => setCardState('visible')}
        onKeyDown={(e) => e.key === 'Enter' && setCardState('visible')}
        style={{
          position: 'fixed',
          right: 0,
          bottom: 120,
          background: '#C9A84C',
          color: '#0F0F0F',
          borderRadius: '8px 0 0 8px',
          padding: '12px 8px',
          cursor: 'pointer',
          writingMode: 'vertical-rl',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 1,
          boxShadow: '-4px 0 12px rgba(0,0,0,0.3)',
          zIndex: 90,
          userSelect: 'none',
        }}
      >
        {icon} {typeLabel}
      </div>
    );
  }

  const cardContent = (
    <>
      <button
        onClick={dismiss}
        aria-label="Închide"
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: 'rgba(255,255,255,0.05)',
          border: 'none',
          borderRadius: '50%',
          width: 24,
          height: 24,
          color: '#9A9490',
          cursor: 'pointer',
          fontSize: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
        }}
      >
        ×
      </button>

      {/* Type badge — click to minimize */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setCardState('minimized')}
        onKeyDown={(e) => e.key === 'Enter' && setCardState('minimized')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(201,168,76,0.15)',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 100,
          padding: '4px 12px',
          marginBottom: 12,
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{
          color: '#C9A84C',
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
        }}>
          {typeLabel}
        </span>
      </div>

      {data.title && (
        <h3 style={{
          color: '#F0EDE6',
          fontSize: 16,
          fontWeight: 700,
          marginBottom: 8,
          lineHeight: 1.3,
          paddingRight: 20,
        }}>
          {data.title}
        </h3>
      )}

      {data.description && (
        <p style={{
          color: '#9A9490',
          fontSize: 13,
          lineHeight: 1.5,
          marginBottom: 12,
        }}>
          {data.description}
        </p>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
      }}>
        <span style={{ color: '#C9A84C', fontSize: 22, fontWeight: 900 }}>
          {data.price} RON
        </span>
        {(data.oldPrice ?? 0) > 0 && (
          <span style={{ color: '#6B6560', fontSize: 14, textDecoration: 'line-through' }}>
            {data.oldPrice} RON
          </span>
        )}
      </div>

      {data.validUntil && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <span style={{ fontSize: 12 }}>⏱️</span>
          <span style={{ color: '#6B6560', fontSize: 12 }}>
            Disponibil până la {data.validUntil}
          </span>
        </div>
      )}

      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 12 }} />

      <p style={{ color: '#4A4540', fontSize: 11, textAlign: 'center' }}>
        Rivers Lounge · riverslounge.ro
      </p>
    </>
  );

  if (isMobile) {
    return (
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 90,
        pointerEvents: 'auto',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1A1300 0%, #0F0F0F 100%)',
          border: '1px solid rgba(201,168,76,0.3)',
          borderTop: '4px solid #C9A84C',
          borderRadius: '16px 16px 0 0',
          padding: '20px',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
          animation: 'slideInUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          position: 'relative',
          maxHeight: '60vh',
          overflowY: 'auto',
        }}>
          {cardContent}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      right: 24,
      bottom: 100,
      zIndex: 90,
      width: 300,
      pointerEvents: 'auto',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1A1300 0%, #0F0F0F 100%)',
        border: '1px solid rgba(201,168,76,0.3)',
        borderLeft: '4px solid #C9A84C',
        borderRadius: 16,
        padding: '20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,168,76,0.1)',
        animation: 'slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        position: 'relative',
      }}>
        {cardContent}
      </div>
    </div>
  );
}
