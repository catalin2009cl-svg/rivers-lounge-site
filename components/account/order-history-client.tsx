'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Package, RefreshCw, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/cart-context';
import type { Order, OrderItem } from '@/lib/server-data';

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 5;

const STATUS_META: Record<
  Order['status'],
  { label: string; bg: string; border: string; color: string }
> = {
  noua:           { label: 'În așteptare', bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' },
  confirmata:     { label: 'Confirmată',   bg: '#F5F3FF', border: '#DDD6FE', color: '#6D28D9' },
  'in-pregatire': { label: 'Se prepară',   bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' },
  livrata:        { label: 'Livrată ✓',    bg: '#F0FDF4', border: '#BBF7D0', color: '#166534' },
  anulata:        { label: 'Anulată',      bg: '#FEF2F2', border: '#FECACA', color: '#991B1B' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
  );
}

function summarizeItems(items: OrderItem[]): string {
  if (items.length === 0) return '';
  const names = items.map((i) => i.name);
  if (names.length <= 2) return names.join(', ');
  const rest = names.length - 2;
  return `${names.slice(0, 2).join(', ')} și ${rest} ${rest === 1 ? 'alt produs' : 'alte produse'}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  initialOrders: Order[];
}

export function OrderHistoryClient({ initialOrders }: Props) {
  const { addItem } = useCart();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const visibleOrders = initialOrders.slice(0, page * PAGE_SIZE);
  const hasMore = visibleOrders.length < initialOrders.length;

  // ── Empty state ───────────────────────────────────────────────────────────

  if (initialOrders.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <Package className="h-16 w-16 text-muted-foreground/25 mx-auto" />
        <h3 className="font-serif text-xl font-semibold text-foreground">
          Nu ai plasat încă nicio comandă
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Explorează meniul nostru și bucură-te de preparatele River&apos;s Lounge livrate acasă sau ridicate din restaurant!
        </p>
        <div className="pt-2">
          <Link href="/meniu">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Vezi meniul →
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Reorder ───────────────────────────────────────────────────────────────

  function handleReorder(order: Order) {
    order.items.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        addItem({
          id: item.id,
          name: item.name,
          description: '',
          price: item.price,
          image: '',
          unit: item.unit,
        });
      }
    });
    router.push('/meniu');
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {visibleOrders.map((order) => {
        const meta = STATUS_META[order.status];
        const isExpanded = expandedId === order.id;

        return (
          <div
            key={order.id}
            className="border border-border rounded-2xl overflow-hidden bg-card hover:border-primary/30 transition-colors"
          >
            {/* Summary row — always visible, click to expand */}
            <button
              className="w-full text-left p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
              onClick={() => setExpandedId(isExpanded ? null : order.id)}
            >
              <div className="flex-1 min-w-0 space-y-1.5">
                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary">{order.id}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium border"
                    style={{ background: meta.bg, color: meta.color, borderColor: meta.border }}
                  >
                    {meta.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {order.orderType === 'livrare' ? '🚚 Livrare' : '🏪 Ridicare'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {order.paymentMethod === 'cash' ? '💵 Numerar' : '💳 Card'}
                  </span>
                </div>
                {/* Date */}
                <p className="text-xs text-muted-foreground">{fmtDateTime(order.createdAt)}</p>
                {/* Product summary */}
                <p className="text-sm text-foreground truncate pr-4">{summarizeItems(order.items)}</p>
              </div>

              {/* Total + chevron */}
              <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
                <span className="text-lg font-bold text-primary">{order.total} RON</span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {/* Expanded details */}
            {isExpanded && (
              <div className="border-t border-border px-5 py-5 bg-secondary/20 space-y-5">

                {/* Products list */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Produse comandate
                  </h4>
                  <div className="bg-card border border-border rounded-xl divide-y divide-border">
                    {order.items.map((item) => (
                      <div
                        key={`${order.id}-${item.id}`}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.name}</p>
                          {item.unit && (
                            <p className="text-xs text-muted-foreground">/ {item.unit}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0 pl-4">
                          <p className="text-sm font-semibold text-foreground">
                            {item.quantity} × {item.price} RON
                          </p>
                          <p className="text-xs text-muted-foreground">
                            = {(item.quantity * item.price).toFixed(0)} RON
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Totals */}
                    <div className="flex justify-between px-4 py-2.5 bg-secondary/40">
                      <span className="text-sm text-muted-foreground">Subtotal</span>
                      <span className="text-sm font-medium text-foreground">{order.subtotal} RON</span>
                    </div>
                    {order.deliveryFee > 0 && (
                      <div className="flex justify-between px-4 py-2 bg-secondary/40">
                        <span className="text-sm text-muted-foreground">Livrare</span>
                        <span className="text-sm text-foreground">{order.deliveryFee} RON</span>
                      </div>
                    )}
                    <div className="flex justify-between px-4 py-3 bg-secondary/40">
                      <span className="text-sm font-bold text-foreground">Total</span>
                      <span className="text-sm font-bold text-primary">{order.total} RON</span>
                    </div>
                  </div>
                </div>

                {/* Delivery address */}
                {order.orderType === 'livrare' && order.address && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Adresă de livrare
                    </h4>
                    <p className="flex items-start gap-2 text-sm text-foreground">
                      <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      {[order.address, order.addressDetails, order.city].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {order.notes && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Mențiuni
                    </h4>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{order.notes}</p>
                  </div>
                )}

                {/* Reorder */}
                <Button
                  onClick={() => handleReorder(order)}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/5 text-primary hover:text-primary"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Recomandă produsele
                </Button>
              </div>
            )}
          </div>
        );
      })}

      {/* Load more */}
      {hasMore && (
        <div className="text-center pt-2">
          <Button
            variant="ghost"
            onClick={() => setPage((p) => p + 1)}
            className="text-muted-foreground hover:text-primary"
          >
            Mai multe comenzi ({initialOrders.length - visibleOrders.length} rămase) ↓
          </Button>
        </div>
      )}
    </div>
  );
}
