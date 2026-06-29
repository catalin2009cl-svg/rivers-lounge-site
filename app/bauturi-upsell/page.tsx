'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Check } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import type { CartProduct } from '@/contexts/cart-context';

const STORAGE_KEY = 'upsell_drinks';

type StoredDrink = CartProduct & { unit?: string };

export default function BauturiUpsellPage() {
  const router = useRouter();
  const { addItem } = useCart();
  const [drinks, setDrinks]     = useState<StoredDrink[]>([]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [ready, setReady]       = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) { router.replace('/comanda/checkout'); return; }
      const parsed = JSON.parse(raw) as StoredDrink[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        router.replace('/comanda/checkout');
        return;
      }
      setDrinks(parsed);
      setReady(true);
    } catch {
      router.replace('/comanda/checkout');
    }
  }, [router]);

  function handleAdd(drink: StoredDrink) {
    addItem(drink);
    setAddedIds((prev) => new Set([...prev, drink.id]));
  }

  function handleContinue() {
    sessionStorage.removeItem(STORAGE_KEY);
    router.push('/comanda/checkout');
  }

  if (!ready) return null;

  const hasAdded = addedIds.size > 0;

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0F0F0F',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: 480,
      margin: '0 auto',
    }}>

      {/* Header */}
      <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'none', border: 'none', color: '#9A9490',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            gap: 6, marginBottom: 20, padding: 0, fontSize: 14,
            touchAction: 'manipulation',
          }}
        >
          <ArrowLeft size={16} />
          Înapoi la meniu
        </button>

        <h1 style={{
          color: '#F0EDE6', fontSize: 22, fontWeight: 700,
          margin: '0 0 6px', fontFamily: 'Georgia, serif',
        }}>
          🥤 Adaugă o băutură?
        </h1>
        <p style={{ color: '#9A9490', fontSize: 14, margin: '0 0 20px', lineHeight: 1.5 }}>
          Completează comanda cu o băutură răcoritoare
        </p>
      </div>

      {/* Scrollable drink grid */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 16px',
        WebkitOverflowScrolling: 'touch' as never,
        overscrollBehavior: 'contain',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
          paddingBottom: 20,
        }}>
          {drinks.map((drink) => {
            const added = addedIds.has(drink.id);
            return (
              <div
                key={drink.id}
                style={{
                  background: added ? 'rgba(201,168,76,0.08)' : '#1A1A1A',
                  border: `1px solid ${added ? '#C9A84C' : '#2E2E2E'}`,
                  borderRadius: 12,
                  padding: '14px 12px',
                  textAlign: 'center',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
              >
                {drink.image ? (
                  <div style={{
                    position: 'relative', width: 56, height: 56,
                    margin: '0 auto 10px', borderRadius: 8, overflow: 'hidden',
                  }}>
                    <Image src={drink.image} alt={drink.name} fill style={{ objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ fontSize: 32, marginBottom: 10 }}>🥤</div>
                )}

                <p style={{ color: '#F0EDE6', fontSize: 13, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>
                  {drink.name}
                </p>
                {drink.unit && (
                  <p style={{ color: '#9A9490', fontSize: 11, marginBottom: 4 }}>{drink.unit}</p>
                )}
                <p style={{ color: '#C9A84C', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
                  {drink.price} RON
                </p>

                <button
                  onClick={() => handleAdd(drink)}
                  disabled={added}
                  style={{
                    width: '100%',
                    background: added ? 'rgba(201,168,76,0.12)' : '#C9A84C',
                    color: added ? '#C9A84C' : '#0F0F0F',
                    border: added ? '1px solid #C9A84C44' : 'none',
                    borderRadius: 8,
                    padding: '10px 12px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: added ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {added ? (
                    <><Check size={14} /> Adăugat</>
                  ) : (
                    '+ Adaugă'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky footer */}
      <div style={{
        flexShrink: 0,
        padding: '12px 16px',
        paddingBottom: 'max(28px, env(safe-area-inset-bottom, 28px))',
        borderTop: '1px solid #2E2E2E',
        background: '#0F0F0F',
      }}>
        {hasAdded && (
          <button
            onClick={handleContinue}
            style={{
              width: '100%',
              background: '#C9A84C',
              color: '#0F0F0F',
              border: 'none',
              borderRadius: 12,
              padding: '15px 16px',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: 10,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Mergi la checkout →
          </button>
        )}
        <button
          onClick={handleContinue}
          style={{
            width: '100%',
            background: 'transparent',
            color: '#9A9490',
            border: '1px solid #2E2E2E',
            borderRadius: 12,
            padding: '13px 16px',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {hasAdded ? 'Continuă fără altă băutură' : 'Continuă fără băutură →'}
        </button>
      </div>
    </div>
  );
}
