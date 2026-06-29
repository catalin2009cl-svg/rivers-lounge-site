'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import type { CartProduct } from '@/contexts/cart-context';

const STORAGE_KEY = 'upsell_drinks';

type StoredDrink = CartProduct & { unit?: string };

export default function BauturiUpsellPage() {
  const router = useRouter();
  const { addItem, updateQuantity } = useCart();
  const [drinks, setDrinks]         = useState<StoredDrink[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [ready, setReady]           = useState(false);

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

  function increment(drink: StoredDrink) {
    const cur = quantities[drink.id] ?? 0;
    if (cur === 0) {
      addItem(drink);               // creates cart entry with qty 1
    } else {
      updateQuantity(drink.id, cur + 1);
    }
    setQuantities((p) => ({ ...p, [drink.id]: cur + 1 }));
  }

  function decrement(drinkId: string) {
    const cur = quantities[drinkId] ?? 0;
    if (cur <= 0) return;
    const next = cur - 1;
    updateQuantity(drinkId, next);  // removes from cart when next === 0
    setQuantities((p) => ({ ...p, [drinkId]: next }));
  }

  function handleContinue() {
    sessionStorage.removeItem(STORAGE_KEY);
    router.push('/comanda/checkout');
  }

  if (!ready) return null;

  const hasAdded = Object.values(quantities).some((q) => q > 0);

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
        <h1 style={{ color: '#F0EDE6', fontSize: 22, fontWeight: 700, margin: '0 0 6px', fontFamily: 'Georgia, serif' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, paddingBottom: 20 }}>
          {drinks.map((drink) => {
            const qty   = quantities[drink.id] ?? 0;
            const added = qty > 0;
            return (
              <div
                key={drink.id}
                style={{
                  background: added ? 'rgba(201,168,76,0.07)' : '#1A1A1A',
                  border: `1px solid ${added ? '#C9A84C55' : '#2E2E2E'}`,
                  borderRadius: 12,
                  padding: '14px 12px',
                  textAlign: 'center',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
              >
                {/* Image with quantity badge */}
                <div style={{ position: 'relative', width: 56, height: 56, margin: '0 auto 10px' }}>
                  {drink.image ? (
                    <div style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                      <Image src={drink.image} alt={drink.name} fill style={{ objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ fontSize: 32, lineHeight: '56px' }}>🥤</div>
                  )}
                  {added && (
                    <div style={{
                      position: 'absolute', top: -7, right: -7,
                      width: 20, height: 20, borderRadius: '50%',
                      background: '#C9A84C', color: '#0F0F0F',
                      fontSize: 11, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 0 0 2px #0F0F0F',
                    }}>
                      {qty}
                    </div>
                  )}
                </div>

                <p style={{ color: '#F0EDE6', fontSize: 13, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>
                  {drink.name}
                </p>
                {drink.unit && (
                  <p style={{ color: '#9A9490', fontSize: 11, marginBottom: 4 }}>{drink.unit}</p>
                )}
                <p style={{ color: '#C9A84C', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
                  {drink.price} RON
                </p>

                {/* Controls: "Adaugă" or [-] qty [+] */}
                {!added ? (
                  <button
                    onClick={() => increment(drink)}
                    style={{
                      width: '100%', background: '#C9A84C', color: '#0F0F0F',
                      border: 'none', borderRadius: 8, padding: '10px 12px',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    + Adaugă
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <button
                      onClick={() => decrement(drink.id)}
                      style={{
                        flex: 1, height: 36, background: '#2A2A2A', color: '#F0EDE6',
                        border: '1px solid #3A3A3A', borderRight: 'none',
                        borderRadius: '8px 0 0 8px', fontSize: 18, fontWeight: 700,
                        cursor: 'pointer', touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      −
                    </button>
                    <div style={{
                      flex: '0 0 40px', height: 36,
                      background: '#1A1A1A',
                      border: '1px solid #3A3A3A', borderLeft: 'none', borderRight: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#F0EDE6', fontSize: 14, fontWeight: 700,
                    }}>
                      {qty}
                    </div>
                    <button
                      onClick={() => increment(drink)}
                      style={{
                        flex: 1, height: 36, background: '#C9A84C', color: '#0F0F0F',
                        border: '1px solid #C9A84C', borderLeft: 'none',
                        borderRadius: '0 8px 8px 0', fontSize: 18, fontWeight: 700,
                        cursor: 'pointer', touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      +
                    </button>
                  </div>
                )}
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
              width: '100%', background: '#C9A84C', color: '#0F0F0F',
              border: 'none', borderRadius: 12, padding: '15px 16px',
              fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 10,
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            Mergi la checkout →
          </button>
        )}
        <button
          onClick={handleContinue}
          style={{
            width: '100%', background: 'transparent', color: '#9A9490',
            border: '1px solid #2E2E2E', borderRadius: 12, padding: '13px 16px',
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          {hasAdded ? 'Continuă fără altă băutură' : 'Continuă fără băutură →'}
        </button>
      </div>
    </div>
  );
}
