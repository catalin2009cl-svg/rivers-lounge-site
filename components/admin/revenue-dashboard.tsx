'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Download, Trophy, BarChart3 } from 'lucide-react';
import type { Order } from '@/lib/server-data';
import type { PeriodRow, TopProduct } from '@/lib/revenue';
import {
  calcRevenue,
  filterOrdersByPeriod,
  buildPeriodRows,
  getTodayOrders,
  getThisMonthOrders,
  getBestDay,
  getTopProducts,
  fmtRON,
  fmtDateRO,
} from '@/lib/revenue';

// ── Types ─────────────────────────────────────────────────────────────────────

type HistoryPeriod = 'thisMonth' | 'lastMonth' | '3months' | 'thisYear' | 'custom';
type ProductsPeriod = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | '3months' | 'all' | 'custom';
type ProductsSort = 'revenue' | 'quantity';
type ProductsStatus = 'all' | 'livrata' | 'confirmata' | 'in-pregatire';
type ProductsOrderType = 'all' | 'livrare' | 'ridicare';

const HISTORY_TABS: { id: HistoryPeriod; label: string }[] = [
  { id: 'thisMonth', label: 'Luna aceasta' },
  { id: 'lastMonth', label: 'Luna trecută' },
  { id: '3months', label: 'Ultimele 3 luni' },
  { id: 'thisYear', label: 'Acest an' },
  { id: 'custom', label: 'Personalizat' },
];

const PRODUCTS_TABS: { id: ProductsPeriod; label: string }[] = [
  { id: 'today', label: 'Azi' },
  { id: 'yesterday', label: 'Ieri' },
  { id: 'thisWeek', label: 'Săptămâna aceasta' },
  { id: 'thisMonth', label: 'Luna aceasta' },
  { id: '3months', label: 'Ultimele 3 luni' },
  { id: 'all', label: 'Tot timpul' },
  { id: 'custom', label: '📅 Personalizat' },
];

const STATUS_FILTERS: { id: ProductsStatus; label: string }[] = [
  { id: 'all', label: 'Toate statusurile' },
  { id: 'livrata', label: 'Livrate' },
  { id: 'confirmata', label: 'Confirmate' },
  { id: 'in-pregatire', label: 'În Pregătire' },
];

const ORDER_TYPE_FILTERS: { id: ProductsOrderType; label: string }[] = [
  { id: 'all', label: 'Livrare + Ridicare' },
  { id: 'livrare', label: 'Doar Livrare' },
  { id: 'ridicare', label: 'Doar Ridicare' },
];

const CATEGORIES = [
  '', 'Bruschete', 'Salate', 'Supe', 'Fel Principal', 'Pizza',
  'Paste', 'Fructe de Mare', 'Garnituri', 'Sosuri', 'Deserturi', 'Băuturi', 'Specialități',
];

const MEDALS = ['🥇', '🥈', '🥉'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function escapeCSV(val: string | number): string {
  const str = String(val ?? '');
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function getPeriodRange(p: HistoryPeriod, customFrom: string, customTo: string): [Date, Date] {
  const now = new Date();
  if (p === 'thisMonth') return [new Date(now.getFullYear(), now.getMonth(), 1), now];
  if (p === 'lastMonth') {
    const f = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const t = new Date(now.getFullYear(), now.getMonth(), 0);
    return [f, t];
  }
  if (p === '3months') {
    const f = new Date(now);
    f.setMonth(f.getMonth() - 3);
    return [f, now];
  }
  if (p === 'thisYear') return [new Date(now.getFullYear(), 0, 1), now];
  // custom
  const f = customFrom ? new Date(customFrom) : new Date(now.getFullYear(), now.getMonth(), 1);
  const t = customTo ? new Date(customTo) : now;
  return [f, t];
}

function exportCSV(rows: PeriodRow[], period: string) {
  const headers = ['Perioadă', 'Comenzi', 'Cash (RON)', 'Card (RON)', 'Total (RON)'];
  const data = rows.map((r) => [r.label, r.count, r.cash, r.card, r.total]);
  const csv = '﻿' + [headers, ...data]
    .map((row) => row.map(escapeCSV).join(';'))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vanzari-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportProductsCSV(products: TopProduct[], periodLabel: string) {
  const headers = ['Produs', 'Categorie', 'Cantitate', 'Venit (RON)', '% Vanzari', 'Perioada'];
  const data = products.map((p) => [p.name, p.category ?? 'Necategorizat', p.quantity, p.revenue, `${p.percentage}%`, periodLabel]);
  const csv = '﻿' + [headers, ...data]
    .map((row) => row.map(escapeCSV).join(';'))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `produse-top-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RevenueDashboard({ allOrders }: { allOrders: Order[] }) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyPeriod, setHistoryPeriod] = useState<HistoryPeriod>('thisMonth');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [productsPeriod, setProductsPeriod] = useState<ProductsPeriod>('thisMonth');
  const [productsSort, setProductsSort] = useState<ProductsSort>('revenue');
  const [productsStatus, setProductsStatus] = useState<ProductsStatus>('livrata');
  const [productsOrderType, setProductsOrderType] = useState<ProductsOrderType>('all');
  const [productsCategory, setProductsCategory] = useState('');
  const [productsSearch, setProductsSearch] = useState('');
  const [productsCustomFromInput, setProductsCustomFromInput] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [productsCustomToInput, setProductsCustomToInput] = useState(() => new Date().toISOString().slice(0, 10));
  const [productsCustomFrom, setProductsCustomFrom] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [productsCustomTo, setProductsCustomTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [productsCustomError, setProductsCustomError] = useState('');
  const [showAllProducts, setShowAllProducts] = useState(false);

  // ── Today ────────────────────────────────────────────────────────────────────

  const todayOrders = useMemo(() => getTodayOrders(allOrders), [allOrders]);
  const todayRevenue = useMemo(() => calcRevenue(todayOrders), [todayOrders]);

  // ── Month ────────────────────────────────────────────────────────────────────

  const monthOrders = useMemo(() => getThisMonthOrders(allOrders), [allOrders]);
  const monthRevenue = useMemo(() => calcRevenue(monthOrders), [monthOrders]);
  const bestDay = useMemo(() => getBestDay(monthOrders), [monthOrders]);
  const daysElapsed = new Date().getDate();
  const avgPerDay = monthRevenue.total / Math.max(daysElapsed, 1);

  // ── History ──────────────────────────────────────────────────────────────────

  const [historyFrom, historyTo] = useMemo(
    () => getPeriodRange(historyPeriod, customFrom, customTo),
    [historyPeriod, customFrom, customTo]
  );

  const historyOrders = useMemo(
    () => filterOrdersByPeriod(allOrders, historyFrom, historyTo),
    [allOrders, historyFrom, historyTo]
  );

  const historyRows = useMemo(
    () => buildPeriodRows(historyOrders, historyFrom, historyTo),
    [historyOrders, historyFrom, historyTo]
  );

  const historyTotals = useMemo(
    () =>
      historyRows.reduce(
        (a, r) => ({ count: a.count + r.count, cash: a.cash + r.cash, card: a.card + r.card, total: a.total + r.total }),
        { count: 0, cash: 0, card: 0, total: 0 }
      ),
    [historyRows]
  );

  const maxBarValue = useMemo(() => Math.max(...historyRows.map((r) => r.total), 1), [historyRows]);

  // ── Products ─────────────────────────────────────────────────────────────────

  const productsOrders = useMemo(() => {
    const now = new Date();
    if (productsPeriod === 'today') return getTodayOrders(allOrders);
    if (productsPeriod === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);
      return filterOrdersByPeriod(allOrders, yesterday, yesterdayEnd);
    }
    if (productsPeriod === 'thisWeek') {
      const day = now.getDay();
      const daysToMonday = day === 0 ? 6 : day - 1;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - daysToMonday);
      weekStart.setHours(0, 0, 0, 0);
      return filterOrdersByPeriod(allOrders, weekStart, now);
    }
    if (productsPeriod === 'thisMonth') {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return filterOrdersByPeriod(allOrders, from, now);
    }
    if (productsPeriod === '3months') {
      const from = new Date(now);
      from.setMonth(from.getMonth() - 3);
      return filterOrdersByPeriod(allOrders, from, now);
    }
    if (productsPeriod === 'custom' && productsCustomFrom && productsCustomTo) {
      return filterOrdersByPeriod(allOrders, new Date(productsCustomFrom), new Date(productsCustomTo));
    }
    return allOrders;
  }, [allOrders, productsPeriod, productsCustomFrom, productsCustomTo]);

  const allTopProducts = useMemo(() => {
    const products = getTopProducts(productsOrders, {
      statusFilter: productsStatus === 'all' ? [] : [productsStatus],
      orderType: productsOrderType,
      categoryFilter: productsCategory,
      searchTerm: productsSearch,
      limit: 200,
    });
    return [...products].sort((a, b) =>
      productsSort === 'quantity' ? b.quantity - a.quantity : b.revenue - a.revenue
    );
  }, [productsOrders, productsSort, productsStatus, productsOrderType, productsCategory, productsSearch]);

  const displayProducts = showAllProducts ? allTopProducts : allTopProducts.slice(0, 10);

  function handleApplyCustom() {
    if (!productsCustomFromInput || !productsCustomToInput) return;
    if (new Date(productsCustomFromInput) > new Date(productsCustomToInput)) {
      setProductsCustomError('Data de început nu poate fi după data de sfârșit.');
      return;
    }
    setProductsCustomError('');
    setProductsCustomFrom(productsCustomFromInput);
    setProductsCustomTo(productsCustomToInput);
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* Row 1 — Today */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon="💰" label="Venituri azi — Cash" value={`${fmtRON(todayRevenue.cash)} RON`} color="#4ADE80" />
        <StatCard icon="💳" label="Venituri azi — Card" value={`${fmtRON(todayRevenue.card)} RON`} color="#60A5FA" />
        <StatCard icon="📊" label="Total venituri azi" value={`${fmtRON(todayRevenue.total)} RON`} color="#C9A84C" />
        <StatCard icon="🛒" label="Comenzi azi" value={String(todayOrders.length)} color="#F0EDE6" />
      </div>

      {/* Row 2 — Month */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon="📅" label="Venituri luna aceasta" value={`${fmtRON(monthRevenue.total)} RON`} color="#C9A84C" />
        <StatCard icon="📦" label="Comenzi luna aceasta" value={String(monthRevenue.count)} color="#F0EDE6" />
        <div className="bg-[#1A1A1A] rounded-xl border border-[#2E2E2E] p-4">
          <div className="text-base mb-1">🏆</div>
          {bestDay ? (
            <>
              <p className="text-xl font-bold text-[#C9A84C] leading-tight">
                {fmtRON(bestDay.revenue)} <span className="text-sm font-normal text-[#9A9490]">RON</span>
              </p>
              <p className="text-xs text-[#9A9490] mt-1 leading-tight">
                Cea mai bună zi<br />
                <span className="text-[#F0EDE6]">{fmtDateRO(bestDay.date)}</span>
              </p>
            </>
          ) : (
            <>
              <p className="text-xl font-bold text-[#9A9490]">—</p>
              <p className="text-xs text-[#9A9490] mt-1">Cea mai bună zi</p>
            </>
          )}
        </div>
        <StatCard icon="📈" label="Medie/zi (luna aceasta)" value={`${fmtRON(avgPerDay)} RON`} color="#C9A84C" />
      </div>

      {/* Revenue history */}
      <div className="bg-[#1A1A1A] rounded-xl border border-[#2E2E2E] overflow-hidden">
        <button
          onClick={() => setHistoryOpen(!historyOpen)}
          className="w-full flex items-center justify-between px-4 py-3.5 text-sm text-[#F0EDE6] font-medium hover:bg-[#242424] transition-colors"
        >
          <span className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#C9A84C]" />
            Istoric Vânzări
          </span>
          {historyOpen
            ? <ChevronUp className="h-4 w-4 text-[#9A9490]" />
            : <ChevronDown className="h-4 w-4 text-[#9A9490]" />}
        </button>

        {historyOpen && (
          <div className="border-t border-[#2E2E2E] p-4 space-y-4">
            {/* Period tabs */}
            <div className="flex flex-wrap gap-1.5">
              {HISTORY_TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setHistoryPeriod(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    historyPeriod === t.id
                      ? 'bg-[#C9A84C] text-[#0F0F0F]'
                      : 'bg-[#242424] text-[#9A9490] hover:text-[#F0EDE6]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Custom date pickers */}
            {historyPeriod === 'custom' && (
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <p className="text-xs text-[#9A9490] mb-1">De la</p>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="bg-[#242424] border border-[#2E2E2E] text-[#F0EDE6] text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                  />
                </div>
                <div>
                  <p className="text-xs text-[#9A9490] mb-1">Până la</p>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="bg-[#242424] border border-[#2E2E2E] text-[#F0EDE6] text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                  />
                </div>
              </div>
            )}

            {historyRows.length === 0 ? (
              <p className="text-sm text-[#9A9490] text-center py-4">
                Nicio comandă în perioada selectată.
              </p>
            ) : (
              <>
                {/* Bar chart */}
                <div className="space-y-1.5">
                  {historyRows.map((row) => (
                    <div key={row.key} className="flex items-center gap-3">
                      <p className="text-xs text-[#9A9490] w-36 shrink-0 truncate">{row.label}</p>
                      <div className="flex-1 h-5 bg-[#242424] rounded overflow-hidden">
                        <div
                          className="h-full rounded transition-all duration-300"
                          style={{
                            width: `${(row.total / maxBarValue) * 100}%`,
                            background: '#C9A84C',
                          }}
                        />
                      </div>
                      <p className="text-xs font-semibold text-[#C9A84C] w-28 text-right shrink-0">
                        {fmtRON(row.total)} RON
                      </p>
                    </div>
                  ))}
                </div>

                {/* Breakdown table */}
                <div className="rounded-lg border border-[#2E2E2E] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#242424] border-b border-[#2E2E2E]">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#9A9490] uppercase tracking-wide">Perioadă</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#9A9490] uppercase tracking-wide">Comenzi</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#9A9490] uppercase tracking-wide">Cash</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#9A9490] uppercase tracking-wide">Card</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#9A9490] uppercase tracking-wide">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyRows.map((row) => (
                        <tr
                          key={row.key}
                          className="border-b border-[#2E2E2E] last:border-0 hover:bg-[#242424] transition-colors"
                        >
                          <td className="px-4 py-2.5 text-[#F0EDE6]">{row.label}</td>
                          <td className="px-4 py-2.5 text-right text-[#9A9490]">{row.count}</td>
                          <td className="px-4 py-2.5 text-right text-[#4ADE80]">{fmtRON(row.cash)} RON</td>
                          <td className="px-4 py-2.5 text-right text-[#60A5FA]">{fmtRON(row.card)} RON</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-[#C9A84C]">{fmtRON(row.total)} RON</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#242424] border-t-2 border-[#C9A84C]/30">
                        <td className="px-4 py-2.5 text-sm font-bold text-[#F0EDE6]">Total</td>
                        <td className="px-4 py-2.5 text-right text-sm font-bold text-[#F0EDE6]">{historyTotals.count}</td>
                        <td className="px-4 py-2.5 text-right text-sm font-bold text-[#4ADE80]">{fmtRON(historyTotals.cash)} RON</td>
                        <td className="px-4 py-2.5 text-right text-sm font-bold text-[#60A5FA]">{fmtRON(historyTotals.card)} RON</td>
                        <td className="px-4 py-2.5 text-right text-sm font-bold text-[#C9A84C]">{fmtRON(historyTotals.total)} RON</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* CSV export */}
                <div className="flex justify-end">
                  <button
                    onClick={() => exportCSV(historyRows, historyPeriod)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg bg-[#242424] border border-[#2E2E2E] text-[#9A9490] hover:text-[#F0EDE6] hover:border-[#C9A84C] transition-all"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Exportă CSV
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Top products */}
      <div className="bg-[#1A1A1A] rounded-xl border border-[#2E2E2E] overflow-hidden">
        {/* Header row — title + sort */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#2E2E2E]">
          <span className="flex items-center gap-2 text-sm font-medium text-[#F0EDE6]">
            <Trophy className="h-4 w-4 text-[#C9A84C]" />
            Produse Cele Mai Vândute
          </span>
          <div className="flex gap-1">
            {(['revenue', 'quantity'] as const).map((id) => (
              <button
                key={id}
                onClick={() => setProductsSort(id)}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  productsSort === id
                    ? 'bg-[#C9A84C] text-[#0F0F0F]'
                    : 'text-[#9A9490] hover:text-[#F0EDE6]'
                }`}
              >
                {id === 'revenue' ? 'Venit' : 'Cantitate'}
              </button>
            ))}
          </div>
        </div>

        {/* Filters panel */}
        <div className="px-4 py-3 border-b border-[#2E2E2E] space-y-2.5">
          {/* Period */}
          <div className="flex flex-wrap gap-1.5">
            {PRODUCTS_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setProductsPeriod(t.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  productsPeriod === t.id
                    ? 'bg-[#C9A84C] text-[#0F0F0F]'
                    : 'bg-[#242424] text-[#9A9490] hover:text-[#F0EDE6]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Custom date range */}
          {productsPeriod === 'custom' && (
            <div className="flex flex-wrap items-end gap-2 pt-0.5">
              <div>
                <p className="text-[10px] text-[#9A9490] mb-1">De la</p>
                <input
                  type="date"
                  value={productsCustomFromInput}
                  onChange={(e) => setProductsCustomFromInput(e.target.value)}
                  style={{ background: '#1A1A1A', border: '1px solid #2E2E2E', color: '#F0EDE6', borderRadius: '6px', padding: '6px 10px', fontSize: '13px' }}
                  className="focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                />
              </div>
              <div>
                <p className="text-[10px] text-[#9A9490] mb-1">Până la</p>
                <input
                  type="date"
                  value={productsCustomToInput}
                  onChange={(e) => setProductsCustomToInput(e.target.value)}
                  style={{ background: '#1A1A1A', border: '1px solid #2E2E2E', color: '#F0EDE6', borderRadius: '6px', padding: '6px 10px', fontSize: '13px' }}
                  className="focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                />
              </div>
              <button
                onClick={handleApplyCustom}
                style={{ background: '#C9A84C', color: '#0F0F0F', fontWeight: 600, padding: '6px 14px', borderRadius: '6px', fontSize: '13px' }}
              >
                Aplică
              </button>
              {productsCustomError && (
                <p className="w-full text-xs text-red-400">{productsCustomError}</p>
              )}
            </div>
          )}

          {/* Status filter */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] text-[#9A9490] uppercase tracking-wide mr-1">Status:</span>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setProductsStatus(f.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  productsStatus === f.id
                    ? f.id === 'livrata'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                      : f.id === 'confirmata'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                      : f.id === 'in-pregatire'
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                      : 'bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/40'
                    : 'bg-[#242424] text-[#9A9490] border border-transparent hover:text-[#F0EDE6]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Order type filter */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] text-[#9A9490] uppercase tracking-wide mr-1">Tip:</span>
            {ORDER_TYPE_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setProductsOrderType(f.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  productsOrderType === f.id
                    ? 'bg-[#C9A84C] text-[#0F0F0F]'
                    : 'bg-[#242424] text-[#9A9490] hover:text-[#F0EDE6]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Category + Search */}
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={productsCategory}
              onChange={(e) => setProductsCategory(e.target.value)}
              className="bg-[#242424] border border-[#2E2E2E] text-xs text-[#F0EDE6] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#C9A84C] appearance-none cursor-pointer"
            >
              <option value="">Toate categoriile</option>
              {CATEGORIES.filter(Boolean).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="relative flex-1 min-w-[160px]">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9A9490] text-xs select-none pointer-events-none">🔍</span>
              <input
                type="text"
                placeholder="Caută produs..."
                value={productsSearch}
                onChange={(e) => setProductsSearch(e.target.value)}
                className="w-full bg-[#242424] border border-[#2E2E2E] text-xs text-[#F0EDE6] placeholder-[#9A9490] rounded-lg pl-7 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
              />
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="px-4 py-2 border-b border-[#2E2E2E]">
          <p className="text-xs text-[#9A9490]">
            Se afișează{' '}
            <span className="text-[#F0EDE6] font-medium">{displayProducts.length}</span>{' '}
            produse din{' '}
            <span className="text-[#F0EDE6] font-medium">{allTopProducts.length}</span>{' '}
            total în perioada selectată
          </p>
        </div>

        {displayProducts.length === 0 ? (
          <p className="text-sm text-[#9A9490] text-center py-8">
            Niciun produs vândut în perioada și filtrele selectate.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2E2E2E] bg-[#242424]">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#9A9490] uppercase tracking-wide w-10">#</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#9A9490] uppercase tracking-wide">Produs</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#9A9490] uppercase tracking-wide">Categorie</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Cantitate</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Venit</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#9A9490] uppercase tracking-wide w-32">% vânzări</th>
                  </tr>
                </thead>
                <tbody>
                  {displayProducts.map((p, idx) => (
                    <tr
                      key={p.name}
                      className="border-b border-[#2E2E2E] last:border-0 hover:bg-[#242424] transition-colors"
                    >
                      <td className="px-4 py-2.5 text-center text-sm">
                        {idx < 3
                          ? MEDALS[idx]
                          : <span className="text-xs text-[#9A9490] font-mono">{idx + 1}</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-[#F0EDE6]">{p.name}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        {p.category
                          ? <span className="text-xs px-2 py-0.5 rounded-full bg-[#242424] text-[#9A9490] border border-[#2E2E2E]">{p.category}</span>
                          : <span className="text-xs text-[#9A9490]">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[#F0EDE6]">{p.quantity} buc.</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-[#C9A84C] whitespace-nowrap">
                        {fmtRON(p.revenue)} RON
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[#242424] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#C9A84C]"
                              style={{ width: `${p.percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-[#9A9490] w-8 text-right shrink-0">{p.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-[#2E2E2E] flex items-center justify-between gap-3">
              {allTopProducts.length > 10 ? (
                <button
                  onClick={() => setShowAllProducts(!showAllProducts)}
                  className="text-xs text-[#9A9490] hover:text-[#C9A84C] transition-colors"
                >
                  {showAllProducts
                    ? '↑ Afișează mai puțin'
                    : `↓ Afișează toate produsele (${allTopProducts.length})`}
                </button>
              ) : <span />}
              <button
                onClick={() => exportProductsCSV(allTopProducts, PRODUCTS_TABS.find((t) => t.id === productsPeriod)?.label ?? productsPeriod)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg bg-[#242424] border border-[#2E2E2E] text-[#9A9490] hover:text-[#F0EDE6] hover:border-[#C9A84C] transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                Exportă CSV
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── StatCard sub-component ────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-[#1A1A1A] rounded-xl border border-[#2E2E2E] p-4">
      <div className="text-base mb-1">{icon}</div>
      <p className="text-xl font-bold leading-tight" style={{ color }}>
        {value}
      </p>
      <p className="text-xs text-[#9A9490] mt-1 leading-tight">{label}</p>
    </div>
  );
}
