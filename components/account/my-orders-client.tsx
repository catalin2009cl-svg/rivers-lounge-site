'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, ChevronDown, ChevronUp, MapPin, RefreshCw } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { openReceipt } from '@/lib/receipt-generator';
import type { Order } from '@/lib/server-data';

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_META: Record<Order['status'], { label: string; color: string; bg: string }> = {
  noua:           { label: 'Nouă 🔵',         color: '#60A5FA', bg: 'rgba(59,130,246,0.12)' },
  confirmata:     { label: 'Confirmată 🟣',   color: '#A78BFA', bg: 'rgba(139,92,246,0.12)' },
  'in-pregatire': { label: 'În Pregătire 🟡', color: '#FCD34D', bg: 'rgba(234,179,8,0.12)'  },
  livrata:        { label: 'Livrată ✅',      color: '#4ADE80', bg: 'rgba(34,197,94,0.12)'  },
  anulata:        { label: 'Anulată ❌',      color: '#F87171', bg: 'rgba(239,68,68,0.12)'  },
};

type FilterTab = 'toate' | 'active' | 'livrate' | 'anulate';

const ACTIVE_STATUSES: Order['status'][] = ['noua', 'confirmata', 'in-pregatire'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function summarize(items: Order['items']): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0].name;
  const rest = items.length - 1;
  return `${items[0].name} (+${rest} ${rest === 1 ? 'produs' : 'produse'})`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  initialOrders: Order[];
}

export function MyOrdersClient({ initialOrders }: Props) {
  const { addItem } = useCart();
  const router = useRouter();
  const [tab, setTab] = useState<FilterTab>('toate');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = initialOrders.filter((o) => {
    if (tab === 'active')  return ACTIVE_STATUSES.includes(o.status);
    if (tab === 'livrate') return o.status === 'livrata';
    if (tab === 'anulate') return o.status === 'anulata';
    return true;
  });

  const totalSpent = initialOrders
    .filter((o) => o.status !== 'anulata')
    .reduce((s, o) => s + (o.total ?? 0), 0);

  const lastOrder = initialOrders[0];

  function handleReorder(order: Order) {
    order.items.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        addItem({ id: item.id, name: item.name, description: '', price: item.price, image: '', unit: item.unit });
      }
    });
    router.push('/meniu');
  }

  // ── Empty state ───────────────────────────────────────────────────────────

  if (initialOrders.length === 0) {
    return (
      <div className="text-center py-20 space-y-4">
        <Package className="h-16 w-16 mx-auto" style={{ color: '#2E2E2E' }} />
        <h3 className="font-serif text-xl font-semibold" style={{ color: '#F0EDE6' }}>
          Nu ai plasat încă nicio comandă.
        </h3>
        <p className="text-sm" style={{ color: '#9A9490' }}>
          Explorează meniul și plasează prima ta comandă!
        </p>
        <Link
          href="/meniu"
          style={{ display: 'inline-block', marginTop: 8, background: '#C9A84C', color: '#0F0F0F', fontWeight: 700, padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}
        >
          Explorează meniul →
        </Link>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'toate',   label: 'Toate' },
    { id: 'active',  label: 'Active' },
    { id: 'livrate', label: 'Livrate' },
    { id: 'anulate', label: 'Anulate' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Total comenzi',      value: initialOrders.length },
          { label: 'Total cheltuit',     value: `${totalSpent.toFixed(0)} RON` },
          { label: 'Ultima comandă',     value: lastOrder ? fmtDate(lastOrder.createdAt) : '—' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#1A1A1A', border: '1px solid #2E2E2E', borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#C9A84C' }}>{s.value}</p>
            <p style={{ fontSize: 12, color: '#9A9490', marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #2E2E2E', gap: 0 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid #C9A84C' : '2px solid transparent',
              color: tab === t.id ? '#F0EDE6' : '#9A9490',
              fontWeight: tab === t.id ? 600 : 400,
              fontSize: 14,
              padding: '9px 18px',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#9A9490', padding: '32px 0', fontSize: 14 }}>
          Nicio comandă în această categorie.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((order) => {
            const meta = STATUS_META[order.status];
            const isExpanded = expandedId === order.id;

            return (
              <div
                key={order.id}
                style={{ background: '#1A1A1A', border: '1px solid #2E2E2E', borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.15s' }}
              >
                {/* Summary row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', padding: '18px 20px', textAlign: 'left' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#C9A84C' }}>{order.id}</span>
                        <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 999, background: meta.bg, color: meta.color, fontWeight: 600 }}>
                          {meta.label}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: '#9A9490', marginBottom: 4 }}>{fmtDate(order.createdAt)}</p>
                      <p style={{ fontSize: 14, color: '#F0EDE6' }}>{summarize(order.items)}</p>
                      <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: '#9A9490' }}>
                          {order.orderType === 'livrare' ? '📍 Livrare' : '🏪 Ridicare'}
                          {order.orderType === 'livrare' && order.address ? ` — ${order.address}, ${order.city}` : ''}
                        </span>
                        <span style={{ fontSize: 12, color: '#9A9490' }}>
                          {order.paymentMethod === 'cash' ? '💵 Cash la livrare' : '💳 Card'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, shrink: 0 } as React.CSSProperties}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: '#C9A84C' }}>{order.total} RON</span>
                      {isExpanded ? <ChevronUp style={{ color: '#9A9490', width: 16, height: 16 }} /> : <ChevronDown style={{ color: '#9A9490', width: 16, height: 16 }} />}
                    </div>
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #2E2E2E', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>

                    {/* Products */}
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#9A9490', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                        Produse comandate
                      </p>
                      <div style={{ background: '#0F0F0F', borderRadius: 8, border: '1px solid #2E2E2E', overflow: 'hidden' }}>
                        {order.items.map((item) => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #2E2E2E' }}>
                            <div>
                              <p style={{ fontSize: 14, color: '#F0EDE6' }}>{item.name}</p>
                              {item.unit && <p style={{ fontSize: 12, color: '#9A9490' }}>/ {item.unit}</p>}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: '#F0EDE6' }}>{item.quantity} × {item.price} RON</p>
                              <p style={{ fontSize: 12, color: '#9A9490' }}>{(item.quantity * item.price).toFixed(0)} RON</p>
                            </div>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', background: '#161616' }}>
                          <span style={{ fontSize: 13, color: '#9A9490' }}>Subtotal</span>
                          <span style={{ fontSize: 13, color: '#F0EDE6' }}>{order.subtotal} RON</span>
                        </div>
                        {order.deliveryFee > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 14px', background: '#161616' }}>
                            <span style={{ fontSize: 13, color: '#9A9490' }}>Livrare</span>
                            <span style={{ fontSize: 13, color: '#F0EDE6' }}>{order.deliveryFee} RON</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#161616', borderTop: '1px solid #2E2E2E' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#F0EDE6' }}>Total</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#C9A84C' }}>{order.total} RON</span>
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    {order.orderType === 'livrare' && order.address && (
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: '#9A9490', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                          Adresă de livrare
                        </p>
                        <p style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 14, color: '#F0EDE6' }}>
                          <MapPin style={{ width: 15, height: 15, color: '#C9A84C', marginTop: 2, flexShrink: 0 }} />
                          {[order.address, order.addressDetails, order.city].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    )}

                    {/* Payment + notes */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: '#9A9490', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Plată</p>
                        <p style={{ fontSize: 14, color: '#F0EDE6' }}>{order.paymentMethod === 'cash' ? '💵 Cash la livrare' : '💳 Card'}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: '#9A9490', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Plasată la</p>
                        <p style={{ fontSize: 13, color: '#F0EDE6' }}>{fmtDateTime(order.createdAt)}</p>
                      </div>
                    </div>

                    {order.notes && (
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: '#9A9490', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                          Mențiuni speciale
                        </p>
                        <p style={{ fontSize: 14, color: '#F0EDE6', whiteSpace: 'pre-wrap' }}>{order.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleReorder(order)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', border: '1px solid #C9A84C55', color: '#C9A84C', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                      >
                        <RefreshCw style={{ width: 14, height: 14 }} />
                        🔄 Recomandă
                      </button>
                      <button
                        onClick={() => openReceipt(order)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid #C9A84C', color: '#C9A84C', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                      >
                        📄 Descarcă bon
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
