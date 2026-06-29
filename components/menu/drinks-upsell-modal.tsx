'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import type { MenuProduct } from '@/lib/server-data';

interface DrinksUpsellModalProps {
  isOpen: boolean;
  drinks: MenuProduct[];
  onClose: () => void;
  onContinue: () => void;
  onAddDrink: (drink: MenuProduct) => void;
}

export function DrinksUpsellModal({
  isOpen,
  drinks,
  onClose,
  onContinue,
  onAddDrink,
}: DrinksUpsellModalProps) {
  if (!isOpen || drinks.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes drinkSlideUp {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 24px)); }
          to   { opacity: 1; transform: translate(-50%, -50%); }
        }
        .drinks-modal { animation: drinkSlideUp 0.25s ease-out; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          zIndex: 9990,
        }}
      />

      {/* Desktop centered card */}
      <div
        className="drinks-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9991,
          background: '#1A1A1A',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 16,
          padding: 28,
          width: '100%', maxWidth: 560,
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 0 50px rgba(0,0,0,0.8)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ color: '#F0EDE6', fontSize: 18, fontWeight: 700, marginBottom: 4, fontFamily: 'Georgia, serif' }}>
              🥤 Adaugă o băutură?
            </h2>
            <p style={{ color: '#9A9490', fontSize: 13 }}>
              Completează comanda cu o băutură răcoritoare
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Închide"
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid #2E2E2E',
              borderRadius: 8, cursor: 'pointer', color: '#9A9490',
              padding: '6px', display: 'flex', alignItems: 'center', flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          margin: '16px 0',
        }}>
          {drinks.map((drink) => (
            <DrinkCard key={drink.id} drink={drink} onAdd={() => onAddDrink(drink)} />
          ))}
        </div>

        <button
          onClick={onContinue}
          style={{
            width: '100%', background: 'transparent', color: '#9A9490',
            border: '1px solid #2E2E2E', borderRadius: 10,
            padding: '11px 16px', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', marginTop: 8,
          }}
        >
          Nu, mulțumesc → Mergi la checkout
        </button>
      </div>
    </>
  );
}

// ── Single drink card (desktop modal only) ────────────────────────────────────

function DrinkCard({ drink, onAdd }: { drink: MenuProduct; onAdd: () => void }) {
  const [active, setActive] = useState(false);

  return (
    <div
      onPointerDown={(e) => { e.stopPropagation(); setActive(true); }}
      onPointerUp={(e) => { e.stopPropagation(); if (active) { setActive(false); onAdd(); } }}
      onPointerLeave={() => setActive(false)}
      onPointerCancel={() => setActive(false)}
      style={{
        background: active ? 'rgba(201,168,76,0.12)' : '#0F0F0F',
        border: `1px solid ${active ? '#C9A84C' : '#2E2E2E'}`,
        borderRadius: 10,
        padding: '12px 8px',
        textAlign: 'center',
        transition: 'border-color 0.12s, background 0.12s, transform 0.1s',
        transform: active ? 'scale(0.97)' : 'scale(1)',
        cursor: 'pointer',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {drink.image ? (
        <div style={{ position: 'relative', width: 48, height: 48, margin: '0 auto 8px', borderRadius: 8, overflow: 'hidden', pointerEvents: 'none' }}>
          <Image src={drink.image} alt={drink.name} fill style={{ objectFit: 'cover' }} />
        </div>
      ) : (
        <div style={{ fontSize: 28, marginBottom: 8, pointerEvents: 'none' }}>🥤</div>
      )}
      <p style={{ color: '#F0EDE6', fontSize: 12, fontWeight: 600, marginBottom: 4, lineHeight: 1.3, pointerEvents: 'none' }}>
        {drink.name}
      </p>
      {drink.unit && (
        <p style={{ color: '#9A9490', fontSize: 11, marginBottom: 4, pointerEvents: 'none' }}>{drink.unit}</p>
      )}
      <p style={{ color: '#C9A84C', fontSize: 12, fontWeight: 700, marginBottom: 8, pointerEvents: 'none' }}>
        {drink.price} RON
      </p>
      <div style={{ background: '#C9A84C', color: '#0F0F0F', borderRadius: 6, padding: '8px 12px', fontSize: 12, fontWeight: 700, pointerEvents: 'none' }}>
        + Adaugă
      </div>
    </div>
  );
}
