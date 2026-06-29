'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TrendingUp, ShoppingBag, Users, Receipt } from 'lucide-react';

interface KpiData {
  todaySales: number;
  todayOrderCount: number;
  todayAvg: number;
  newUsersToday: number;
  ordersPerHour: number[];
  bestsellersToday: { name: string; count: number; revenue: number }[];
  bestsellersWeek: { name: string; count: number; revenue: number }[];
  bestsellersMonth: { name: string; count: number; revenue: number }[];
  heatmap: number[][];
}

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => `${i}:00`);
const DAY_LABELS = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'];
const GOLD = '#C9A84C';

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center`} style={{ background: `${color}18` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <span className="text-xs text-[#9A9490]">{label}</span>
      </div>
      <p className="text-2xl font-bold text-[#F0EDE6]">{value}</p>
      {sub && <p className="text-xs text-[#9A9490] mt-0.5">{sub}</p>}
    </div>
  );
}

export function KpiDashboard() {
  const [data, setData] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bsTab, setBsTab] = useState<'today' | 'week' | 'month'>('today');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/kpi', { cache: 'no-store' });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 60_000);
    return () => clearInterval(id);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-[#1a1a1a] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const hourChartData = HOUR_LABELS.map((label, i) => ({ label, orders: data.ordersPerHour[i] }));

  const bestsellers =
    bsTab === 'today' ? data.bestsellersToday : bsTab === 'week' ? data.bestsellersWeek : data.bestsellersMonth;

  const heatmapMax = Math.max(1, ...data.heatmap.flat());

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Vânzări azi"
          value={`${data.todaySales.toFixed(0)} RON`}
          icon={TrendingUp}
          color="#C9A84C"
        />
        <StatCard
          label="Comenzi azi"
          value={String(data.todayOrderCount)}
          sub="non-anulate"
          icon={ShoppingBag}
          color="#60A5FA"
        />
        <StatCard
          label="Clienți noi"
          value={String(data.newUsersToday)}
          sub="înregistrați azi"
          icon={Users}
          color="#4ADE80"
        />
        <StatCard
          label="Valoare medie"
          value={`${data.todayAvg.toFixed(0)} RON`}
          sub="per comandă azi"
          icon={Receipt}
          color="#F472B6"
        />
      </div>

      {/* Orders per hour chart */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[#F0EDE6] mb-4">Comenzi pe oră (azi)</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={hourChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: '#666', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval={3}
            />
            <YAxis tick={{ fill: '#666', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8 }}
              labelStyle={{ color: '#9A9490', fontSize: 12 }}
              itemStyle={{ color: GOLD }}
            />
            <Bar dataKey="orders" radius={[3, 3, 0, 0]}>
              {hourChartData.map((entry, i) => (
                <Cell key={i} fill={entry.orders > 0 ? GOLD : '#2a2a2a'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bestsellers + Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bestsellers */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#F0EDE6]">Cele mai vândute</h3>
            <div className="flex gap-1">
              {(['today', 'week', 'month'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setBsTab(t)}
                  className="text-xs px-2.5 py-1 rounded-md transition-colors"
                  style={{
                    background: bsTab === t ? GOLD : 'transparent',
                    color: bsTab === t ? '#000' : '#666',
                    border: `1px solid ${bsTab === t ? GOLD : '#333'}`,
                  }}
                >
                  {t === 'today' ? 'Azi' : t === 'week' ? '7 zile' : 'Lună'}
                </button>
              ))}
            </div>
          </div>
          {bestsellers.length === 0 ? (
            <p className="text-xs text-[#666] py-4 text-center">Nicio comandă în această perioadă.</p>
          ) : (
            <div className="space-y-2">
              {bestsellers.slice(0, 8).map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-[#666] w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs text-[#F0EDE6] truncate">{item.name}</span>
                      <span className="text-xs text-[#9A9490] shrink-0">×{item.count}</span>
                    </div>
                    <div
                      className="h-1 rounded-full"
                      style={{
                        width: `${(item.count / (bestsellers[0]?.count || 1)) * 100}%`,
                        background: GOLD,
                        opacity: 0.6 + (0.4 * i) / bestsellers.length,
                      }}
                    />
                  </div>
                  <span className="text-xs text-[#C9A84C] shrink-0 font-medium">
                    {item.revenue.toFixed(0)} RON
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Peak heatmap */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#F0EDE6] mb-4">Peak ore (7 zile) — comenzi/oră</h3>
          <div className="overflow-x-auto">
            <div style={{ minWidth: 340 }}>
              {/* Hour labels */}
              <div className="flex mb-1 ml-8">
                {[0, 4, 8, 12, 16, 20].map((h) => (
                  <div
                    key={h}
                    className="text-[9px] text-[#666]"
                    style={{ width: `${(4 / 24) * 100}%`, textAlign: 'left' }}
                  >
                    {h}:00
                  </div>
                ))}
              </div>
              {/* Grid */}
              {data.heatmap.map((dayData, dayIdx) => (
                <div key={dayIdx} className="flex items-center mb-0.5">
                  <span className="text-[9px] text-[#666] w-8 shrink-0">{DAY_LABELS[dayIdx]}</span>
                  {dayData.map((val, hr) => {
                    const intensity = val / heatmapMax;
                    return (
                      <div
                        key={hr}
                        title={`${DAY_LABELS[dayIdx]} ${hr}:00 — ${val} comenzi`}
                        style={{
                          flex: 1,
                          height: 14,
                          margin: '0 1px',
                          borderRadius: 2,
                          background:
                            val === 0
                              ? '#1f1f1f'
                              : `rgba(201,168,76,${0.15 + intensity * 0.85})`,
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
