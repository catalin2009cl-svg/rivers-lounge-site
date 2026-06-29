'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ShoppingBag,
  Calendar,
  Star,
  Users,
  Wallet,
  Mail,
  Phone,
  MapPin,
  Clock,
  Loader2,
  UserCheck,
  UserX,
  BadgeCheck,
  Edit3,
  ExternalLink,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { updateAdminNote, toggleUserActive, verifyUser, revokeVerification } from '@/lib/actions/users';

// ── Types (mirror what the server fetches) ────────────────────────────────────

interface OrderItem { id: string; name: string; price: number; quantity: number }

interface ProfileOrder {
  id: string;
  status: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  orderType: string;
  paymentMethod: string;
  items: OrderItem[];
  address: string | null;
  city: string | null;
  createdAt: string;
  isPriority: boolean;
}

interface ProfileReservation {
  id: string;
  location: string;
  date: string;
  time: string;
  guests: number;
  status: string;
  eventType: string | null;
  notes: string | null;
  createdAt: string;
}

interface WalletTx {
  id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
}

interface LoyaltyData {
  currentLevel: number;
  currentTier: string | null;
  walletBalance: number;
  totalCashbackEarned: number;
  totalCompletedOrders: number;
  totalSpentEligible: number;
  referralCode: string | null;
  totalReferrals: number;
  referralCashbackEarned: number;
  welcomeBonusActive: boolean;
  priorityDelivery: boolean;
  level3BonusChoice: string | null;
  firstCompletedOrderAt: string | null;
  lastCompletedOrderAt: string | null;
  createdAt: string;
  walletTransactions: WalletTx[];
}

interface ReferralMade {
  id: string;
  status: string;
  referredOrdersCount: number;
  totalCashbackEarned: number;
  referredUser: { id: string; name: string; email: string; createdAt: string; totalOrders: number };
  createdAt: string;
}

export interface UserProfileFull {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  clientCode: string | null;
  avatar: string | null;
  birthday: string | null;
  isActive: boolean;
  isVerified: boolean;
  verifiedAt: string | null;
  verifiedBy: string | null;
  totalOrders: number;
  totalSpent: number;
  lastActivityAt: string | null;
  lastLoginAt: string | null;
  lastOrderAt: string | null;
  adminNote: string | null;
  role: string;
  createdAt: string;
  referredByCode: string | null;
  orders: ProfileOrder[];
  reservations: ProfileReservation[];
  loyaltyProfile: LoyaltyData | null;
  referralsMade: ReferralMade[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'astăzi';
  if (days === 1) return 'ieri';
  if (days < 30) return `acum ${days} zile`;
  const months = Math.floor(days / 30);
  if (months < 12) return `acum ${months} luni`;
  return `acum ${Math.floor(months / 12)} ani`;
}

const LEVEL_META: Record<number, { bg: string; color: string; label: string; border: string }> = {
  1: { bg: 'rgba(156,163,175,0.12)', color: '#9CA3AF', border: 'rgba(156,163,175,0.3)', label: 'Nivel 1 — Standard' },
  2: { bg: 'rgba(59,130,246,0.12)',  color: '#60A5FA', border: 'rgba(59,130,246,0.3)',  label: 'Nivel 2 — Silver' },
  3: { bg: 'rgba(139,92,246,0.12)',  color: '#A78BFA', border: 'rgba(139,92,246,0.3)',  label: 'Nivel 3 — Gold' },
  4: { bg: 'rgba(201,168,76,0.12)',  color: '#C9A84C', border: 'rgba(201,168,76,0.3)',  label: 'Nivel 4 — Platinum' },
};

const ORDER_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  noua:           { label: 'Nouă',          bg: 'rgba(59,130,246,0.15)',  color: '#60A5FA' },
  confirmata:     { label: 'Confirmată',    bg: 'rgba(139,92,246,0.15)', color: '#A78BFA' },
  'in-pregatire': { label: 'În Pregătire', bg: 'rgba(234,179,8,0.15)',  color: '#FCD34D' },
  livrata:        { label: 'Livrată',      bg: 'rgba(34,197,94,0.15)',  color: '#4ADE80' },
  anulata:        { label: 'Anulată',      bg: 'rgba(239,68,68,0.15)',  color: '#F87171' },
};

const RES_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  noua:       { label: 'Nouă',       bg: 'rgba(59,130,246,0.15)', color: '#60A5FA' },
  confirmata: { label: 'Confirmată', bg: 'rgba(34,197,94,0.15)',  color: '#4ADE80' },
  anulata:    { label: 'Anulată',    bg: 'rgba(239,68,68,0.15)',  color: '#F87171' },
  finalizata: { label: 'Finalizată', bg: 'rgba(201,168,76,0.15)', color: '#C9A84C' },
};

const TX_LABELS: Record<string, string> = {
  CASHBACK_EARNED:  'Cashback câștigat',
  CASHBACK_EXPIRED: 'Cashback expirat',
  CREDIT_USED:      'Credit utilizat',
  CREDIT_EXPIRED:   'Credit expirat',
  MANUAL_CREDIT:    'Credit manual',
  MANUAL_DEBIT:     'Debit manual',
  LEVEL_BONUS:      'Bonus nivel',
  REFERRAL_CASHBACK:'Cashback referral',
  REFERRAL_WELCOME: 'Bonus bun venit',
};

type TabId = 'overview' | 'comenzi' | 'rezervari' | 'fidelizare' | 'referrals';

// ── Spending chart data ───────────────────────────────────────────────────────

function buildMonthlyData(orders: ProfileOrder[]) {
  const counts: Record<string, { month: string; total: number; count: number }> = {};
  orders.forEach((o) => {
    if (o.status === 'anulata') return;
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('ro-RO', { month: 'short', year: '2-digit' });
    if (!counts[key]) counts[key] = { month: label, total: 0, count: 0 };
    counts[key].total += o.total;
    counts[key].count += 1;
  });
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([, v]) => v);
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  user: UserProfileFull;
}

export function UserProfilePageClient({ user: initialUser }: Props) {
  const [user, setUser] = useState(initialUser);
  const [tab, setTab] = useState<TabId>('overview');
  const [adminNote, setAdminNote] = useState(user.adminNote ?? '');
  const [savingNote, setSavingNote] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [verifyingId, setVerifyingId] = useState(false);

  const monthlyData = buildMonthlyData(user.orders);
  const lm = LEVEL_META[user.loyaltyProfile?.currentLevel ?? 1] ?? LEVEL_META[1];

  const completedOrders = user.orders.filter((o) => o.status === 'livrata');
  const cancelledOrders = user.orders.filter((o) => o.status === 'anulata');
  const avgOrderValue = completedOrders.length > 0
    ? completedOrders.reduce((s, o) => s + o.total, 0) / completedOrders.length
    : 0;

  async function handleSaveNote() {
    if (savingNote) return;
    setSavingNote(true);
    const result = await updateAdminNote(user.id, adminNote);
    if (result.success) {
      setUser((u) => ({ ...u, adminNote }));
      toast.success('Notă salvată.');
    } else {
      toast.error('Eroare la salvare.');
    }
    setSavingNote(false);
  }

  async function handleToggleActive() {
    if (togglingActive) return;
    setTogglingActive(true);
    const result = await toggleUserActive(user.id, !user.isActive);
    if (result.success) {
      setUser((u) => ({ ...u, isActive: !u.isActive }));
      toast.success(user.isActive ? 'Cont dezactivat.' : 'Cont activat.');
    } else {
      toast.error('Eroare la actualizare.');
    }
    setTogglingActive(false);
  }

  async function handleVerify() {
    setVerifyingId(true);
    const result = await verifyUser(user.id, 'Admin');
    if (result.success) {
      setUser((u) => ({ ...u, isVerified: true, verifiedAt: new Date().toISOString(), verifiedBy: 'Admin' }));
      toast.success('Cont verificat.');
    } else {
      toast.error('Eroare.');
    }
    setVerifyingId(false);
  }

  async function handleRevoke() {
    setVerifyingId(true);
    const result = await revokeVerification(user.id);
    if (result.success) {
      setUser((u) => ({ ...u, isVerified: false, verifiedAt: null, verifiedBy: null }));
      toast.success('Verificare revocată.');
    } else {
      toast.error('Eroare.');
    }
    setVerifyingId(false);
  }

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',   label: 'Prezentare generală', icon: <Star className="h-4 w-4" /> },
    { id: 'comenzi',    label: `Comenzi (${user.orders.length})`, icon: <ShoppingBag className="h-4 w-4" /> },
    { id: 'rezervari',  label: `Rezervări (${user.reservations.length})`, icon: <Calendar className="h-4 w-4" /> },
    { id: 'fidelizare', label: 'Fidelizare', icon: <Wallet className="h-4 w-4" /> },
    { id: 'referrals',  label: `Referrals (${user.referralsMade.length})`, icon: <Users className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-[#1A1A1A] rounded-2xl border border-[#2E2E2E] overflow-hidden">
        {/* Level banner */}
        <div className="h-1.5 w-full" style={{ background: lm.color, opacity: 0.6 }} />

        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${lm.color}`, flexShrink: 0 }}
            />
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#C9A84C', color: '#0F0F0F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 24, flexShrink: 0 }}>
              {initials(user.name)}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-[#F0EDE6]">{user.name}</h1>
              <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background: lm.bg, color: lm.color, border: `1px solid ${lm.border}` }}>
                {lm.label}
              </span>
              {!user.isActive && (
                <span className="text-xs px-2 py-0.5 rounded bg-red-500/15 text-red-400 font-semibold border border-red-500/30">INACTIV</span>
              )}
              {user.isVerified && (
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-semibold border border-blue-500/30">✓ VERIFICAT</span>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-[#9A9490]">
              <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{user.email}</span>
              {user.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{user.phone}</span>}
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Înregistrat {fmtDate(user.createdAt)}</span>
              {user.clientCode && <span className="text-xs font-mono text-[#C9A84C]">#{user.clientCode}</span>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button
              size="sm"
              variant="ghost"
              disabled={togglingActive}
              onClick={handleToggleActive}
              className={`h-8 px-3 text-xs border ${user.isActive ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-green-500/30 text-green-400 hover:bg-green-500/10'}`}
            >
              {togglingActive ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : user.isActive ? <><UserX className="h-3.5 w-3.5 mr-1" />Dezactivează</> : <><UserCheck className="h-3.5 w-3.5 mr-1" />Activează</>}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={verifyingId}
              onClick={user.isVerified ? handleRevoke : handleVerify}
              className={`h-8 px-3 text-xs border ${user.isVerified ? 'border-[#2E2E2E] text-[#9A9490] hover:text-red-400 hover:border-red-500/30' : 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10'}`}
            >
              {verifyingId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><BadgeCheck className="h-3.5 w-3.5 mr-1" />{user.isVerified ? 'Revocă verificare' : 'Verifică cont'}</>}
            </Button>
            <Link
              href={`/admin/comenzi?userId=${user.id}`}
              className="inline-flex items-center gap-1.5 h-8 px-3 text-xs border border-[#2E2E2E] text-[#9A9490] hover:text-[#F0EDE6] hover:border-[#C9A84C44] rounded-md transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Comenzi
            </Link>
          </div>
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total comenzi', value: String(user.totalOrders), sub: `${completedOrders.length} finalizate`, color: '#60A5FA' },
          { label: 'Total cheltuit', value: `${user.totalSpent.toFixed(0)} RON`, sub: `~${avgOrderValue.toFixed(0)} RON/comandă`, color: '#C9A84C' },
          { label: 'Portofel fidelizare', value: user.loyaltyProfile ? `${user.loyaltyProfile.walletBalance.toFixed(2)} RON` : '—', sub: user.loyaltyProfile ? `${user.loyaltyProfile.totalCashbackEarned.toFixed(0)} RON câștigat total` : 'Niciun profil', color: '#4ADE80' },
          { label: 'Rezervări', value: String(user.reservations.length), sub: user.lastOrderAt ? `Ultima cmd: ${fmtRelative(user.lastOrderAt)}` : 'Nicio comandă', color: '#A78BFA' },
        ].map((s) => (
          <div key={s.label} className="bg-[#1A1A1A] rounded-xl border border-[#2E2E2E] p-4">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-[#9A9490] mt-0.5">{s.label}</p>
            <p className="text-[10px] text-[#4E4E4E] mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Spending chart */}
      {monthlyData.length > 1 && (
        <div className="bg-[#1A1A1A] rounded-2xl border border-[#2E2E2E] p-5">
          <p className="text-sm font-semibold text-[#F0EDE6] mb-4">Cheltuieli lunare (RON)</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: '#9A9490', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9A9490', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1A1A1A', border: '1px solid #2E2E2E', borderRadius: 8, color: '#F0EDE6', fontSize: 12 }}
                formatter={(v: number) => [`${v.toFixed(0)} RON`, 'Total']}
              />
              <Area type="monotone" dataKey="total" stroke="#C9A84C" fill="url(#spendGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #2E2E2E', gap: 0, overflowX: 'auto' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid #C9A84C' : '2px solid transparent',
              color: tab === t.id ? '#F0EDE6' : '#9A9490',
              fontWeight: tab === t.id ? 600 : 400,
              fontSize: 13,
              padding: '10px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'color 0.15s',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ──────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: profile details */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#1A1A1A] rounded-2xl border border-[#2E2E2E] p-5">
              <p className="text-xs font-semibold text-[#C9A84C] uppercase tracking-wide mb-4">Date cont</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Telefon', value: user.phone ?? '—' },
                  { label: 'Cod client', value: user.clientCode ?? '—' },
                  { label: 'Rol', value: user.role === 'admin' ? 'Administrator' : 'Client' },
                  { label: 'Înregistrat', value: fmtDate(user.createdAt) },
                  { label: 'Ultima autentificare', value: user.lastLoginAt ? fmtRelative(user.lastLoginAt) : '—' },
                  { label: 'Ultima activitate', value: user.lastActivityAt ? fmtRelative(user.lastActivityAt) : '—' },
                  { label: 'Ziua de naștere', value: user.birthday ?? '—' },
                  { label: 'Referit de', value: user.referredByCode ?? '—' },
                  { label: 'Comenzi anulate', value: String(cancelledOrders.length) },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-[#9A9490] mb-0.5">{item.label}</p>
                    <p className="text-sm text-[#F0EDE6] font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Last 5 orders */}
            {user.orders.length > 0 && (
              <div className="bg-[#1A1A1A] rounded-2xl border border-[#2E2E2E] p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-[#C9A84C] uppercase tracking-wide">Ultimele comenzi</p>
                  <button onClick={() => setTab('comenzi')} className="text-xs text-[#60A5FA] hover:underline">
                    Vezi toate →
                  </button>
                </div>
                <div className="space-y-2">
                  {user.orders.slice(0, 5).map((o) => {
                    const sm = ORDER_STATUS[o.status] ?? { label: o.status, bg: 'rgba(156,163,175,0.15)', color: '#9CA3AF' };
                    return (
                      <div key={o.id} className="flex items-center justify-between gap-3 py-2 border-b border-[#2E2E2E] last:border-0">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-[#C9A84C] font-semibold">{o.id}</span>
                            {o.isPriority && <span className="text-[10px] text-yellow-400">⚡</span>}
                          </div>
                          <p className="text-xs text-[#9A9490]">{fmtDate(o.createdAt)} · {o.items.length} produse</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-[#C9A84C]">{o.total.toFixed(0)} RON</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: sm.bg, color: sm.color }}>{sm.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: admin note + verification */}
          <div className="space-y-4">
            {/* Verification */}
            <div className="bg-[#1A1A1A] rounded-2xl border border-[#2E2E2E] p-5">
              <p className="text-xs font-semibold text-[#C9A84C] uppercase tracking-wide mb-3">Verificare cont</p>
              {user.isVerified ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <span className="text-sm font-semibold text-blue-400">Cont verificat</span>
                  </div>
                  {user.verifiedAt && <p className="text-xs text-[#9A9490]">Pe: {fmtDate(user.verifiedAt)}</p>}
                  {user.verifiedBy && <p className="text-xs text-[#9A9490]">De: {user.verifiedBy}</p>}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={verifyingId}
                    onClick={handleRevoke}
                    className="mt-3 text-xs h-7 px-3 text-[#9A9490] hover:text-red-400 hover:bg-red-500/10"
                  >
                    {verifyingId ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Revocă ×'}
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-[#9A9490] mb-3">Cont neverificat.</p>
                  <Button
                    size="sm"
                    disabled={verifyingId}
                    onClick={handleVerify}
                    className="text-xs h-7 px-3 bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25"
                    style={{ background: 'rgba(59,130,246,0.12)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.3)' }}
                  >
                    {verifyingId ? <Loader2 className="h-3 w-3 animate-spin" /> : '✓ Verifică acest cont'}
                  </Button>
                </div>
              )}
            </div>

            {/* Admin note */}
            <div className="bg-[#1A1A1A] rounded-2xl border border-[#2E2E2E] p-5">
              <p className="text-xs font-semibold text-[#C9A84C] uppercase tracking-wide mb-3">Notă internă</p>
              <Textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Adaugă o notă internă..."
                rows={4}
                className="text-sm resize-none bg-[#0F0F0F] border-[#2E2E2E] text-[#F0EDE6] placeholder:text-[#4E4E4E] focus-visible:ring-[#C9A84C] mb-2"
              />
              <Button
                size="sm"
                className="bg-[#C9A84C] text-[#0F0F0F] font-bold hover:bg-[#B8963E] border-0 gap-1.5"
                disabled={savingNote}
                onClick={handleSaveNote}
              >
                {savingNote ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Se salvează...</> : <><Edit3 className="h-3.5 w-3.5" />Salvează notă</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── COMENZI ───────────────────────────────────────────────────────── */}
      {tab === 'comenzi' && (
        <div className="bg-[#1A1A1A] rounded-2xl border border-[#2E2E2E] overflow-hidden">
          {user.orders.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingBag className="h-10 w-10 text-[#2E2E2E] mx-auto mb-3" />
              <p className="text-sm text-[#9A9490]">Nicio comandă.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#242424] border-b border-[#2E2E2E]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">ID / Dată</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Tip</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Produse</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Total</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {user.orders.map((o) => {
                    const sm = ORDER_STATUS[o.status] ?? { label: o.status, bg: 'rgba(156,163,175,0.15)', color: '#9CA3AF' };
                    return (
                      <tr key={o.id} className="border-b border-[#2E2E2E] last:border-0 hover:bg-[#242424] transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-mono text-xs font-semibold text-[#C9A84C]">{o.id}</p>
                          <p className="text-xs text-[#9A9490] mt-0.5">{fmtDate(o.createdAt)}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#9A9490] whitespace-nowrap">
                          {o.orderType === 'livrare' ? '🚚 Livrare' : '🏪 Ridicare'}
                          {o.isPriority && <span className="ml-1.5 text-yellow-400">⚡</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-xs text-[#F0EDE6]">{o.items[0]?.name}</p>
                          {o.items.length > 1 && <p className="text-xs text-[#9A9490]">+{o.items.length - 1} produse</p>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="font-semibold text-[#C9A84C]">{o.total.toFixed(0)} RON</p>
                          {o.deliveryFee > 0 && <p className="text-xs text-[#9A9490]">+{o.deliveryFee} livrare</p>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: sm.bg, color: sm.color }}>
                            {sm.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── REZERVĂRI ─────────────────────────────────────────────────────── */}
      {tab === 'rezervari' && (
        <div className="space-y-3">
          {user.reservations.length === 0 ? (
            <div className="bg-[#1A1A1A] rounded-2xl border border-[#2E2E2E] p-12 text-center">
              <Calendar className="h-10 w-10 text-[#2E2E2E] mx-auto mb-3" />
              <p className="text-sm text-[#9A9490]">Nicio rezervare.</p>
            </div>
          ) : (
            user.reservations.map((r) => {
              const sm = RES_STATUS[r.status] ?? { label: r.status, bg: 'rgba(156,163,175,0.15)', color: '#9CA3AF' };
              return (
                <div key={r.id} className="bg-[#1A1A1A] rounded-xl border border-[#2E2E2E] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-3.5 w-3.5 text-[#C9A84C]" />
                        <p className="font-medium text-[#F0EDE6] text-sm">{r.location}</p>
                      </div>
                      <p className="text-xs text-[#9A9490]">{r.date} la {r.time} · {r.guests} persoane</p>
                      {r.eventType && <p className="text-xs text-[#9A9490] mt-0.5">Eveniment: {r.eventType}</p>}
                      {r.notes && <p className="text-xs text-[#9A9490] mt-1 italic">"{r.notes}"</p>}
                      <p className="text-xs text-[#4E4E4E] mt-1">{fmtDate(r.createdAt)}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0" style={{ background: sm.bg, color: sm.color }}>
                      {sm.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── FIDELIZARE ────────────────────────────────────────────────────── */}
      {tab === 'fidelizare' && (
        <div className="space-y-4">
          {!user.loyaltyProfile ? (
            <div className="bg-[#1A1A1A] rounded-2xl border border-[#2E2E2E] p-12 text-center">
              <Star className="h-10 w-10 text-[#2E2E2E] mx-auto mb-3" />
              <p className="text-sm text-[#9A9490]">Niciun profil de fidelizare.</p>
            </div>
          ) : (
            <>
              {/* Level card */}
              <div className="bg-[#1A1A1A] rounded-2xl border border-[#2E2E2E] p-5">
                <div className="flex items-center gap-4 mb-5">
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: lm.bg, border: `1px solid ${lm.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Star className="h-6 w-6" style={{ color: lm.color }} />
                  </div>
                  <div>
                    <p className="font-bold text-lg" style={{ color: lm.color }}>{lm.label}</p>
                    {user.loyaltyProfile.currentTier && (
                      <p className="text-xs text-[#9A9490]">Tier: {user.loyaltyProfile.currentTier}</p>
                    )}
                    {user.loyaltyProfile.priorityDelivery && (
                      <p className="text-xs text-yellow-400 mt-0.5">⚡ Livrare prioritară activă</p>
                    )}
                    {user.loyaltyProfile.welcomeBonusActive && (
                      <p className="text-xs text-purple-400 mt-0.5">🎉 Bonus de bun venit activ</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Portofel activ', value: `${user.loyaltyProfile.walletBalance.toFixed(2)} RON`, color: '#4ADE80' },
                    { label: 'Cashback total câștigat', value: `${user.loyaltyProfile.totalCashbackEarned.toFixed(2)} RON`, color: '#C9A84C' },
                    { label: 'Comenzi eligibile', value: String(user.loyaltyProfile.totalCompletedOrders), color: '#60A5FA' },
                    { label: 'Cheltuit eligibil', value: `${user.loyaltyProfile.totalSpentEligible.toFixed(0)} RON`, color: '#A78BFA' },
                  ].map((s) => (
                    <div key={s.label} className="bg-[#0F0F0F] rounded-xl p-3">
                      <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-[10px] text-[#9A9490] mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {user.loyaltyProfile.referralCode && (
                  <div className="mt-4 flex items-center gap-3 bg-[#0F0F0F] rounded-xl p-3">
                    <div>
                      <p className="text-[10px] text-[#9A9490] uppercase tracking-wide mb-0.5">Cod referral personal</p>
                      <p className="font-mono text-base font-bold text-[#C9A84C]">{user.loyaltyProfile.referralCode}</p>
                    </div>
                  </div>
                )}

                {user.loyaltyProfile.level3BonusChoice && (
                  <div className="mt-3 bg-[#0F0F0F] rounded-xl p-3">
                    <p className="text-[10px] text-[#9A9490] uppercase tracking-wide mb-0.5">Bonus Nivel 3 ales</p>
                    <p className="text-sm text-[#A78BFA] font-medium">{user.loyaltyProfile.level3BonusChoice}</p>
                  </div>
                )}
              </div>

              {/* Wallet transactions */}
              {user.loyaltyProfile.walletTransactions.length > 0 && (
                <div className="bg-[#1A1A1A] rounded-2xl border border-[#2E2E2E] overflow-hidden">
                  <div className="px-5 py-3 border-b border-[#2E2E2E] bg-[#242424]">
                    <p className="text-xs font-semibold text-[#9A9490] uppercase tracking-wide">Istoric tranzacții portofel</p>
                  </div>
                  <div className="divide-y divide-[#2E2E2E]">
                    {user.loyaltyProfile.walletTransactions.map((tx) => {
                      const isDebit = tx.type === 'CREDIT_USED' || tx.type === 'CREDIT_EXPIRED' || tx.type === 'CASHBACK_EXPIRED' || tx.type === 'MANUAL_DEBIT';
                      return (
                        <div key={tx.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#242424] transition-colors">
                          <div>
                            <p className="text-sm font-medium text-[#F0EDE6]">{TX_LABELS[tx.type] ?? tx.type}</p>
                            {tx.description && <p className="text-xs text-[#9A9490]">{tx.description}</p>}
                            <p className="text-xs text-[#4E4E4E]">{fmtDateTime(tx.createdAt)} · {tx.balanceBefore.toFixed(2)} → {tx.balanceAfter.toFixed(2)} RON</p>
                          </div>
                          <span className="text-sm font-bold ml-4 shrink-0" style={{ color: isDebit ? '#F87171' : '#4ADE80' }}>
                            {isDebit ? '-' : '+'}{tx.amount.toFixed(2)} RON
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── REFERRALS ─────────────────────────────────────────────────────── */}
      {tab === 'referrals' && (
        <div className="space-y-4">
          {user.loyaltyProfile && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#1A1A1A] rounded-xl border border-[#2E2E2E] p-4">
                <p className="text-2xl font-bold text-[#A78BFA]">{user.loyaltyProfile.totalReferrals}</p>
                <p className="text-xs text-[#9A9490] mt-0.5">Utilizatori referiți</p>
              </div>
              <div className="bg-[#1A1A1A] rounded-xl border border-[#2E2E2E] p-4">
                <p className="text-2xl font-bold text-[#C9A84C]">{user.loyaltyProfile.referralCashbackEarned.toFixed(2)} RON</p>
                <p className="text-xs text-[#9A9490] mt-0.5">Câștig din referrals</p>
              </div>
            </div>
          )}
          {user.referralsMade.length === 0 ? (
            <div className="bg-[#1A1A1A] rounded-2xl border border-[#2E2E2E] p-12 text-center">
              <Users className="h-10 w-10 text-[#2E2E2E] mx-auto mb-3" />
              <p className="text-sm text-[#9A9490]">Niciun referral efectuat.</p>
            </div>
          ) : (
            <div className="bg-[#1A1A1A] rounded-2xl border border-[#2E2E2E] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#242424] border-b border-[#2E2E2E]">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide">Utilizator referit</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Înregistrat</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Comenzi</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Câștig</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.referralsMade.map((ref) => {
                      const statusColor = ref.status === 'COMPLETED' ? '#4ADE80' : ref.status === 'ACTIVE' ? '#60A5FA' : '#9A9490';
                      return (
                        <tr key={ref.id} className="border-b border-[#2E2E2E] last:border-0 hover:bg-[#242424] transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-[#F0EDE6]">{ref.referredUser.name}</p>
                            <p className="text-xs text-[#9A9490]">{ref.referredUser.email}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-[#9A9490] whitespace-nowrap">
                            {fmtDate(ref.referredUser.createdAt)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold" style={{ background: 'rgba(59,130,246,0.15)', color: '#60A5FA' }}>
                              {ref.referredOrdersCount}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm font-semibold text-[#C9A84C]">{ref.totalCashbackEarned.toFixed(2)} RON</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: statusColor }}>
                              {ref.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
