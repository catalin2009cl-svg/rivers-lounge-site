'use client';

import { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Download,
  MapPin,
  Clock,
  FileText,
  Truck,
  Store,
  Banknote,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Order } from '@/lib/server-data';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
  );
}

const STATUS_META: Record<Order['status'], { label: string; bg: string; color: string }> = {
  noua:           { label: 'Nouă',          bg: 'rgba(59,130,246,0.15)',  color: '#60A5FA' },
  confirmata:     { label: 'Confirmată',    bg: 'rgba(139,92,246,0.15)', color: '#A78BFA' },
  'in-pregatire': { label: 'În Pregătire', bg: 'rgba(234,179,8,0.15)',  color: '#FCD34D' },
  livrata:        { label: 'Livrată',      bg: 'rgba(34,197,94,0.15)',  color: '#4ADE80' },
  anulata:        { label: 'Anulată',      bg: 'rgba(239,68,68,0.15)',  color: '#F87171' },
};

const ALL_STATUSES = ['noua', 'confirmata', 'in-pregatire', 'livrata', 'anulata'] as const;
const STATUS_LABELS: Record<Order['status'], string> = {
  noua: 'Nouă', confirmata: 'Confirmată', 'in-pregatire': 'În Pregătire', livrata: 'Livrată', anulata: 'Anulată',
};

const PAGE_SIZE = 25;

function escapeCSV(val: string | number | null | undefined): string {
  const str = String(val ?? '');
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function exportCSV(orders: Order[]) {
  const headers = ['ID', 'Data', 'Nume', 'Telefon', 'Adresă', 'Oraș', 'Produse', 'Subtotal', 'Livrare', 'Total', 'Plată', 'Status'];
  const rows = orders.map((o) => [
    o.id,
    new Date(o.createdAt).toLocaleDateString('ro-RO'),
    o.name,
    o.phone,
    [o.address, o.addressDetails].filter(Boolean).join(' '),
    o.city,
    o.items.map((i) => `${i.quantity}x ${i.name}`).join('; '),
    o.subtotal,
    o.deliveryFee,
    o.total,
    o.paymentMethod === 'cash' ? 'Numerar' : 'Card',
    STATUS_META[o.status].label,
  ]);
  const csv = '﻿' + [headers, ...rows]
    .map((r) => r.map(escapeCSV).join(';'))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `arhiva-comenzi-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  initialOrders: Order[];
}

export function ArchiveAdminClient({ initialOrders }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Search & filters
  const [search, setSearch] = useState('');
  const [filterStatuses, setFilterStatuses] = useState<Set<Order['status']>>(new Set(ALL_STATUSES));
  const [filterType, setFilterType] = useState<'all' | 'livrare' | 'ridicare'>('all');
  const [filterPayment, setFilterPayment] = useState<'all' | 'cash' | 'card'>('all');
  const [filterMinTotal, setFilterMinTotal] = useState('');
  const [filterMaxTotal, setFilterMaxTotal] = useState('');
  const [filterCity, setFilterCity] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const uniqueCities = useMemo(() => {
    const cities = [...new Set(initialOrders.map((o) => o.city).filter(Boolean))].sort();
    return cities;
  }, [initialOrders]);

  const filtered = useMemo(() => {
    return initialOrders.filter((o) => {
      if (!filterStatuses.has(o.status)) return false;
      if (filterType !== 'all' && o.orderType !== filterType) return false;
      if (filterPayment !== 'all' && o.paymentMethod !== filterPayment) return false;
      if (filterCity !== 'all' && o.city !== filterCity) return false;
      if (filterMinTotal && o.total < Number(filterMinTotal)) return false;
      if (filterMaxTotal && o.total > Number(filterMaxTotal)) return false;
      if (filterDateFrom && o.createdAt < filterDateFrom) return false;
      if (filterDateTo && o.createdAt > filterDateTo + 'T23:59:59') return false;

      if (search) {
        const q = search.toLowerCase();
        const inName = o.name.toLowerCase().includes(q);
        const inPhone = o.phone.toLowerCase().includes(q);
        const inId = o.id.toLowerCase().includes(q);
        const inAddress = (o.address + ' ' + (o.addressDetails ?? '') + ' ' + (o.city ?? '')).toLowerCase().includes(q);
        const inProducts = o.items.some((i) => i.name.toLowerCase().includes(q));
        if (!inName && !inPhone && !inId && !inAddress && !inProducts) return false;
      }

      return true;
    });
  }, [initialOrders, search, filterStatuses, filterType, filterPayment, filterCity, filterMinTotal, filterMaxTotal, filterDateFrom, filterDateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalValue = filtered
    .filter((o) => o.status !== 'anulata')
    .reduce((sum, o) => sum + (o.total ?? 0), 0);

  function toggleStatus(s: Order['status']) {
    setFilterStatuses((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
    setPage(1);
  }

  function resetFilters() {
    setSearch('');
    setFilterStatuses(new Set(ALL_STATUSES));
    setFilterType('all');
    setFilterPayment('all');
    setFilterCity('all');
    setFilterMinTotal('');
    setFilterMaxTotal('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setPage(1);
  }

  return (
    <div className="space-y-4">
      {/* Main search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9A9490]" />
        <Input
          placeholder="Caută în arhivă... (nume, telefon, ID comandă, adresă, produs)"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-12 h-12 text-base bg-[#1A1A1A] border-[#2E2E2E] text-[#F0EDE6] placeholder:text-[#9A9490] focus-visible:ring-[#C9A84C]"
        />
      </div>

      {/* Advanced filters toggle */}
      <div className="bg-[#1A1A1A] rounded-xl border border-[#2E2E2E]">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm text-[#9A9490] hover:text-[#F0EDE6] transition-colors"
        >
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtre avansate
          </span>
          {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showFilters && (
          <div className="px-4 pb-4 border-t border-[#2E2E2E] pt-4 space-y-4">
            {/* Status checkboxes */}
            <div>
              <p className="text-xs font-semibold text-[#9A9490] uppercase tracking-wide mb-2">Status comandă</p>
              <div className="flex flex-wrap gap-2">
                {ALL_STATUSES.map((s) => {
                  const m = STATUS_META[s];
                  const checked = filterStatuses.has(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggleStatus(s)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-all"
                      style={
                        checked
                          ? { background: m.bg, color: m.color, borderColor: m.color }
                          : { background: 'transparent', color: '#9A9490', borderColor: '#2E2E2E' }
                      }
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 2: type, payment, city */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-[#9A9490] mb-1">Tip livrare</p>
                <select
                  value={filterType}
                  onChange={(e) => { setFilterType(e.target.value as typeof filterType); setPage(1); }}
                  className="w-full bg-[#242424] border border-[#2E2E2E] text-[#F0EDE6] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                >
                  <option value="all">Toate</option>
                  <option value="livrare">Livrare</option>
                  <option value="ridicare">Ridicare</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-[#9A9490] mb-1">Metodă plată</p>
                <select
                  value={filterPayment}
                  onChange={(e) => { setFilterPayment(e.target.value as typeof filterPayment); setPage(1); }}
                  className="w-full bg-[#242424] border border-[#2E2E2E] text-[#F0EDE6] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                >
                  <option value="all">Toate</option>
                  <option value="cash">Numerar</option>
                  <option value="card">Card</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-[#9A9490] mb-1">Oraș</p>
                <select
                  value={filterCity}
                  onChange={(e) => { setFilterCity(e.target.value); setPage(1); }}
                  className="w-full bg-[#242424] border border-[#2E2E2E] text-[#F0EDE6] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                >
                  <option value="all">Toate</option>
                  {uniqueCities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Row 3: total range + date range */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-[#9A9490] mb-1">Total minim (RON)</p>
                <Input
                  type="number"
                  placeholder="0"
                  value={filterMinTotal}
                  onChange={(e) => { setFilterMinTotal(e.target.value); setPage(1); }}
                  className="bg-[#242424] border-[#2E2E2E] text-[#F0EDE6] placeholder:text-[#9A9490] focus-visible:ring-[#C9A84C]"
                />
              </div>
              <div>
                <p className="text-xs text-[#9A9490] mb-1">Total maxim (RON)</p>
                <Input
                  type="number"
                  placeholder="∞"
                  value={filterMaxTotal}
                  onChange={(e) => { setFilterMaxTotal(e.target.value); setPage(1); }}
                  className="bg-[#242424] border-[#2E2E2E] text-[#F0EDE6] placeholder:text-[#9A9490] focus-visible:ring-[#C9A84C]"
                />
              </div>
              <div>
                <p className="text-xs text-[#9A9490] mb-1">De la data</p>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }}
                  className="w-full bg-[#242424] border border-[#2E2E2E] text-[#F0EDE6] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                />
              </div>
              <div>
                <p className="text-xs text-[#9A9490] mb-1">Până la data</p>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }}
                  className="w-full bg-[#242424] border border-[#2E2E2E] text-[#F0EDE6] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={resetFilters}
                className="text-xs text-[#9A9490] hover:text-[#F0EDE6] underline transition-colors"
              >
                Resetează filtrele
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#9A9490]">
          Se afișează{' '}
          <span className="text-[#F0EDE6] font-medium">{filtered.length}</span>{' '}
          comenzi din{' '}
          <span className="text-[#F0EDE6] font-medium">{initialOrders.length}</span>{' '}
          total &nbsp;|&nbsp; Valoare:{' '}
          <span className="text-[#C9A84C] font-semibold">{totalValue.toFixed(0)} RON</span>
        </p>
        <Button
          size="sm"
          className="gap-2 bg-[#1A1A1A] border border-[#2E2E2E] text-[#9A9490] hover:text-[#F0EDE6] hover:border-[#C9A84C] shadow-none"
          onClick={() => exportCSV(filtered)}
          disabled={filtered.length === 0}
        >
          <Download className="h-3.5 w-3.5" />
          Exportă CSV
        </Button>
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <div className="bg-[#1A1A1A] rounded-2xl border border-[#2E2E2E] p-12 text-center">
          <Search className="h-10 w-10 text-[#2E2E2E] mx-auto mb-3" />
          <p className="text-sm text-[#9A9490]">
            {initialOrders.length === 0
              ? 'Nicio comandă în arhivă încă.'
              : 'Nicio comandă nu corespunde criteriilor de filtrare.'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-[#1A1A1A] rounded-2xl border border-[#2E2E2E] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2E2E2E] bg-[#242424]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Data & Ora</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">ID Comandă</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Client</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Produse</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Adresă / Oraș</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Total</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Plată</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Acțiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((o) => {
                    const meta = STATUS_META[o.status];
                    const isExpanded = expandedId === o.id;

                    return (
                      <>
                        <tr
                          key={o.id}
                          className="border-b border-[#2E2E2E] last:border-0 hover:bg-[#242424] transition-colors cursor-pointer"
                          onClick={() => setExpandedId(isExpanded ? null : o.id)}
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-[#9A9490]">
                            {fmtDateTime(o.createdAt)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-mono text-xs font-semibold text-[#C9A84C]">{o.id}</span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-[#F0EDE6] whitespace-nowrap">{o.name}</p>
                            <p className="text-xs text-[#9A9490] whitespace-nowrap">{o.phone}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-[#F0EDE6]">{o.items[0]?.name}</p>
                            {o.items.length > 1 && (
                              <p className="text-xs text-[#9A9490]">și {o.items.length - 1} altele</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {o.orderType === 'livrare' ? (
                              <>
                                <p className="text-xs text-[#F0EDE6]">{o.address}</p>
                                <p className="text-xs text-[#9A9490]">{o.city}</p>
                              </>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA' }}
                              >
                                <Store className="h-3 w-3" /> Ridicare
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <p className="font-semibold text-[#F0EDE6]">{o.total} RON</p>
                            {o.deliveryFee > 0 && (
                              <p className="text-xs text-[#9A9490]">+{o.deliveryFee} livrare</p>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <span className="inline-flex items-center gap-1 text-xs text-[#9A9490]">
                              <Banknote className="h-3 w-3" />
                              {o.paymentMethod === 'cash' ? 'Numerar' : 'Card'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <span
                              className="inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: meta.bg, color: meta.color }}
                            >
                              {meta.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              {o.orderType === 'livrare' && (
                                <a
                                  href={
                                    o.userLat && o.userLng
                                      ? `https://maps.google.com/?q=${o.userLat},${o.userLng}`
                                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([o.address, o.addressDetails, o.city].filter(Boolean).join(', '))}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-[#60A5FA] hover:underline"
                                  title="Vezi pe Maps"
                                >
                                  <MapPin className="h-3.5 w-3.5" />
                                </a>
                              )}
                              <button
                                className="h-7 w-7 flex items-center justify-center rounded text-[#9A9490] hover:text-[#F0EDE6] hover:bg-[#242424] transition-colors"
                                onClick={() => setExpandedId(isExpanded ? null : o.id)}
                                title={isExpanded ? 'Ascunde' : 'Detalii'}
                              >
                                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded row */}
                        {isExpanded && (
                          <tr key={`${o.id}-detail`} className="bg-[#0F0F0F] border-b border-[#2E2E2E]">
                            <td colSpan={9} className="px-6 py-5">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                                {o.orderType === 'livrare' && (
                                  <ArchiveDetail icon={<MapPin className="h-3.5 w-3.5" />} label="Adresă livrare">
                                    <span>
                                      {o.address}{o.addressDetails ? `, ${o.addressDetails}` : ''}{o.city ? `, ${o.city}` : ''}
                                    </span>
                                    {' '}
                                    <a
                                      href={
                                        o.userLat && o.userLng
                                          ? `https://maps.google.com/?q=${o.userLat},${o.userLng}`
                                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([o.address, o.addressDetails, o.city].filter(Boolean).join(', '))}`
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[#60A5FA] hover:underline text-xs font-medium"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      📍 Vezi pe Maps
                                    </a>
                                  </ArchiveDetail>
                                )}
                                <ArchiveDetail icon={<Clock className="h-3.5 w-3.5" />} label="Plasată la">
                                  {fmtDateTime(o.createdAt)}
                                </ArchiveDetail>
                                <ArchiveDetail icon={<Clock className="h-3.5 w-3.5" />} label="Actualizată la">
                                  {fmtDateTime(o.updatedAt)}
                                </ArchiveDetail>
                              </div>

                              <p className="text-xs font-semibold text-[#C9A84C] uppercase tracking-wide mb-2">
                                Produse comandate
                              </p>
                              <div className="bg-[#1A1A1A] rounded-lg border border-[#2E2E2E] divide-y divide-[#2E2E2E]">
                                {o.items.map((item) => (
                                  <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
                                    <div>
                                      <p className="text-sm text-[#F0EDE6] font-medium">{item.name}</p>
                                      {item.unit && <p className="text-xs text-[#9A9490]">/ {item.unit}</p>}
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-semibold text-[#C9A84C]">{item.quantity} × {item.price} RON</p>
                                      <p className="text-xs text-[#9A9490]">{(item.quantity * item.price).toFixed(0)} RON</p>
                                    </div>
                                  </div>
                                ))}
                                <div className="flex justify-between px-4 py-2.5 bg-[#242424]">
                                  <span className="text-sm text-[#9A9490]">Subtotal</span>
                                  <span className="text-sm font-semibold text-[#F0EDE6]">{o.subtotal} RON</span>
                                </div>
                                {o.deliveryFee > 0 && (
                                  <div className="flex justify-between px-4 py-2 bg-[#242424]">
                                    <span className="text-sm text-[#9A9490]">Livrare</span>
                                    <span className="text-sm font-semibold text-[#F0EDE6]">{o.deliveryFee} RON</span>
                                  </div>
                                )}
                                <div className="flex justify-between px-4 py-2.5 bg-[#242424]">
                                  <span className="text-sm font-bold text-[#F0EDE6]">Total</span>
                                  <span className="text-sm font-bold text-[#C9A84C]">{o.total} RON</span>
                                </div>
                              </div>

                              {o.notes && (
                                <div className="mt-4">
                                  <ArchiveDetail icon={<FileText className="h-3.5 w-3.5" />} label="Mențiuni client">
                                    <span className="whitespace-pre-wrap">{o.notes}</span>
                                  </ArchiveDetail>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#9A9490]">
                Pagina {page} din {totalPages} ({filtered.length} comenzi)
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-8 px-3 text-xs rounded-lg bg-[#1A1A1A] border border-[#2E2E2E] text-[#9A9490] hover:text-[#F0EDE6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Anterior
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  if (pageNum < 1 || pageNum > totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`h-8 w-8 text-xs rounded-lg border transition-colors ${
                        pageNum === page
                          ? 'bg-[#C9A84C] border-[#C9A84C] text-[#0F0F0F] font-bold'
                          : 'bg-[#1A1A1A] border-[#2E2E2E] text-[#9A9490] hover:text-[#F0EDE6]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-8 px-3 text-xs rounded-lg bg-[#1A1A1A] border border-[#2E2E2E] text-[#9A9490] hover:text-[#F0EDE6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Următor →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ArchiveDetail({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-xs font-semibold text-[#9A9490] mb-1">
        {icon}
        {label}
      </div>
      <div className="text-sm text-[#F0EDE6]">{children}</div>
    </div>
  );
}
