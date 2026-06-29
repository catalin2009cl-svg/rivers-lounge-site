'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Loader2, X, ExternalLink, ShoppingBag, Calendar, Star, Users, Settings, User } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { updateAdminNote, toggleUserActive } from '@/lib/actions/users';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface ProfileOrder {
  id: string;
  status: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  orderType: string;
  paymentMethod: string;
  items: OrderItem[];
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
  createdAt: string;
}

interface WalletTx {
  id: string;
  type: string;
  amount: number;
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
  walletTransactions: WalletTx[];
}

interface ReferralMade {
  id: string;
  status: string;
  referredOrdersCount: number;
  totalCashbackEarned: number;
  referredUser: { id: string; name: string; email: string; createdAt: string };
  createdAt: string;
}

export interface UserProfileData {
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

const LEVEL_COLORS: Record<number, { bg: string; color: string; label: string }> = {
  1: { bg: 'rgba(156,163,175,0.15)', color: '#9CA3AF', label: 'Nivel 1' },
  2: { bg: 'rgba(59,130,246,0.15)',  color: '#60A5FA', label: 'Nivel 2' },
  3: { bg: 'rgba(139,92,246,0.15)',  color: '#A78BFA', label: 'Nivel 3' },
  4: { bg: 'rgba(201,168,76,0.15)',  color: '#C9A84C', label: 'Nivel 4' },
};

const ORDER_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  noua:           { label: 'Nouă',          bg: 'rgba(59,130,246,0.15)',  color: '#60A5FA' },
  confirmata:     { label: 'Confirmată',    bg: 'rgba(139,92,246,0.15)', color: '#A78BFA' },
  'in-pregatire': { label: 'În Pregătire', bg: 'rgba(234,179,8,0.15)',  color: '#FCD34D' },
  livrata:        { label: 'Livrată',      bg: 'rgba(34,197,94,0.15)',  color: '#4ADE80' },
  anulata:        { label: 'Anulată',      bg: 'rgba(239,68,68,0.15)',  color: '#F87171' },
};

const RES_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  noua:      { label: 'Nouă',      bg: 'rgba(59,130,246,0.15)', color: '#60A5FA' },
  confirmata:{ label: 'Confirmată',bg: 'rgba(34,197,94,0.15)',  color: '#4ADE80' },
  anulata:   { label: 'Anulată',   bg: 'rgba(239,68,68,0.15)',  color: '#F87171' },
  finalizata:{ label: 'Finalizată',bg: 'rgba(201,168,76,0.15)', color: '#C9A84C' },
};

const TX_TYPE_LABELS: Record<string, string> = {
  CASHBACK_EARNED:  'Cashback câștigat',
  CASHBACK_EXPIRED: 'Cashback expirat',
  CREDIT_USED:      'Credit utilizat',
  CREDIT_EXPIRED:   'Credit expirat',
  MANUAL_CREDIT:    'Credit manual',
  MANUAL_DEBIT:     'Debit manual',
  LEVEL_BONUS:      'Bonus nivel',
  REFERRAL_CASHBACK:'Cashback referral',
  REFERRAL_WELCOME: 'Bonus bun venit referral',
};

type TabId = 'profil' | 'comenzi' | 'rezervari' | 'fidelizare' | 'referrals' | 'actiuni';

const TABS: { id: TabId; icon: React.ReactNode; label: string }[] = [
  { id: 'profil',    icon: <User className="h-3.5 w-3.5" />,      label: 'Profil' },
  { id: 'comenzi',   icon: <ShoppingBag className="h-3.5 w-3.5" />, label: 'Comenzi' },
  { id: 'rezervari', icon: <Calendar className="h-3.5 w-3.5" />,   label: 'Rezervări' },
  { id: 'fidelizare',icon: <Star className="h-3.5 w-3.5" />,       label: 'Fidelizare' },
  { id: 'referrals', icon: <Users className="h-3.5 w-3.5" />,      label: 'Referrals' },
  { id: 'actiuni',   icon: <Settings className="h-3.5 w-3.5" />,   label: 'Acțiuni' },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  userId: string | null;
  onClose: () => void;
}

export function UserProfilePanel({ userId, onClose }: Props) {
  const [data, setData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<TabId>('profil');

  // Acțiuni admin state
  const [adminNote, setAdminNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);

  const fetchProfile = useCallback(async (id: string) => {
    setLoading(true);
    setError(false);
    setData(null);
    try {
      const res = await fetch(`/api/admin/users/${id}/profile`);
      if (!res.ok) throw new Error('fetch failed');
      const json = await res.json() as UserProfileData;
      setData(json);
      setAdminNote(json.adminNote ?? '');
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      setTab('profil');
      fetchProfile(userId);
    }
  }, [userId, fetchProfile]);

  async function handleSaveNote() {
    if (!data || savingNote) return;
    setSavingNote(true);
    const result = await updateAdminNote(data.id, adminNote);
    if (result.success) {
      toast.success('Notă salvată.');
    } else {
      toast.error('Eroare la salvare.');
    }
    setSavingNote(false);
  }

  async function handleToggleActive() {
    if (!data || togglingActive) return;
    setTogglingActive(true);
    const result = await toggleUserActive(data.id, !data.isActive);
    if (result.success) {
      setData((prev) => prev ? { ...prev, isActive: !prev.isActive } : prev);
      toast.success(data.isActive ? 'Cont dezactivat.' : 'Cont activat.');
    } else {
      toast.error('Eroare la actualizare.');
    }
    setTogglingActive(false);
  }

  const open = !!userId;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col"
        style={{ background: '#111111', border: '1px solid #2E2E2E', color: '#F0EDE6' }}
      >
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-[#2E2E2E] shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-semibold text-[#F0EDE6]">
              Profil utilizator
            </SheetTitle>
            {data && (
              <Link
                href={`/admin/utilizatori/${data.id}`}
                className="inline-flex items-center gap-1 text-xs text-[#C9A84C] hover:text-[#B8963E] transition-colors"
              >
                Profil complet <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        </SheetHeader>

        {/* Loading / Error */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-[#C9A84C]" />
          </div>
        )}
        {error && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
            <p className="text-[#9A9490] text-sm">Nu s-a putut încărca profilul.</p>
            <Button
              size="sm"
              variant="ghost"
              className="text-[#C9A84C] border border-[#C9A84C33] hover:bg-[#C9A84C11] h-7 px-3 text-xs"
              onClick={() => userId && fetchProfile(userId)}
            >
              Încearcă din nou
            </Button>
          </div>
        )}

        {/* Content */}
        {data && !loading && (
          <>
            {/* User identity strip */}
            <div className="px-5 py-4 border-b border-[#2E2E2E] shrink-0 flex items-center gap-3">
              {data.avatar ? (
                <img
                  src={data.avatar}
                  alt={data.name}
                  style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #C9A84C', flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#C9A84C', color: '#0F0F0F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                  {initials(data.name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-[#F0EDE6] text-sm">{data.name}</p>
                  {data.loyaltyProfile && (() => {
                    const lc = LEVEL_COLORS[data.loyaltyProfile!.currentLevel] ?? LEVEL_COLORS[1];
                    return (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: lc.bg, color: lc.color }}>
                        {lc.label}
                      </span>
                    );
                  })()}
                  {!data.isActive && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-semibold">INACTIV</span>
                  )}
                  {data.isVerified && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-semibold">✓ VERIFICAT</span>
                  )}
                </div>
                <p className="text-xs text-[#9A9490] truncate">{data.email}</p>
                <p className="text-xs text-[#9A9490]">{data.totalOrders} comenzi · {data.totalSpent.toFixed(0)} RON total</p>
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-[#2E2E2E] shrink-0 overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-xs whitespace-nowrap transition-colors shrink-0"
                  style={{
                    color: tab === t.id ? '#C9A84C' : '#9A9490',
                    fontWeight: tab === t.id ? 600 : 400,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: tab === t.id ? '2px solid #C9A84C' : '2px solid transparent',
                  }}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

              {/* ── PROFIL ─────────────────────────────────────────────── */}
              {tab === 'profil' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Telefon', value: data.phone ?? '—' },
                      { label: 'Cod client', value: data.clientCode ?? '—' },
                      { label: 'Înregistrat', value: fmtDate(data.createdAt) },
                      { label: 'Ultima autentificare', value: data.lastLoginAt ? fmtRelative(data.lastLoginAt) : '—' },
                      { label: 'Ultima activitate', value: data.lastActivityAt ? fmtRelative(data.lastActivityAt) : '—' },
                      { label: 'Ultima comandă', value: data.lastOrderAt ? fmtRelative(data.lastOrderAt) : '—' },
                      { label: 'Ziua de naștere', value: data.birthday ?? '—' },
                      { label: 'Referit de', value: data.referredByCode ?? '—' },
                    ].map((item) => (
                      <div key={item.label} className="bg-[#1A1A1A] rounded-lg border border-[#2E2E2E] p-3">
                        <p className="text-[10px] text-[#9A9490] uppercase tracking-wide mb-0.5">{item.label}</p>
                        <p className="text-sm text-[#F0EDE6] font-medium">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Total comenzi', value: String(data.totalOrders), color: '#60A5FA' },
                      { label: 'Total cheltuit', value: `${data.totalSpent.toFixed(0)} RON`, color: '#C9A84C' },
                      { label: 'Portofel', value: data.loyaltyProfile ? `${data.loyaltyProfile.walletBalance.toFixed(2)} RON` : '—', color: '#4ADE80' },
                    ].map((s) => (
                      <div key={s.label} className="bg-[#1A1A1A] rounded-lg border border-[#2E2E2E] p-3 text-center">
                        <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-[10px] text-[#9A9490] mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── COMENZI ────────────────────────────────────────────── */}
              {tab === 'comenzi' && (
                <div className="space-y-2">
                  {data.orders.length === 0 ? (
                    <p className="text-sm text-[#9A9490] text-center py-8">Nicio comandă.</p>
                  ) : (
                    data.orders.map((o) => {
                      const sm = ORDER_STATUS[o.status] ?? { label: o.status, bg: 'rgba(156,163,175,0.15)', color: '#9CA3AF' };
                      return (
                        <div key={o.id} className="bg-[#1A1A1A] rounded-lg border border-[#2E2E2E] px-3 py-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-semibold text-[#C9A84C]">{o.id}</span>
                                {o.isPriority && <span className="text-[10px] px-1 py-0.5 rounded" style={{ background: 'rgba(234,179,8,0.15)', color: '#FACC15', border: '1px solid rgba(234,179,8,0.3)' }}>⚡ PRIO</span>}
                              </div>
                              <p className="text-xs text-[#9A9490] mt-0.5">
                                {fmtDate(o.createdAt)} · {o.orderType === 'livrare' ? '🚚 Livrare' : '🏪 Ridicare'} · {o.items.length} {o.items.length === 1 ? 'produs' : 'produse'}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-[#C9A84C]">{o.total.toFixed(0)} RON</p>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: sm.bg, color: sm.color }}>
                                {sm.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {data.orders.length > 0 && (
                    <Link
                      href={`/admin/comenzi?userId=${data.id}`}
                      className="block text-center text-xs text-[#60A5FA] hover:underline py-2"
                    >
                      Vezi toate comenzile în pagina comenzi →
                    </Link>
                  )}
                </div>
              )}

              {/* ── REZERVĂRI ──────────────────────────────────────────── */}
              {tab === 'rezervari' && (
                <div className="space-y-2">
                  {data.reservations.length === 0 ? (
                    <p className="text-sm text-[#9A9490] text-center py-8">Nicio rezervare.</p>
                  ) : (
                    data.reservations.map((r) => {
                      const sm = RES_STATUS[r.status] ?? { label: r.status, bg: 'rgba(156,163,175,0.15)', color: '#9CA3AF' };
                      return (
                        <div key={r.id} className="bg-[#1A1A1A] rounded-lg border border-[#2E2E2E] px-3 py-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-[#F0EDE6]">{r.location}</p>
                              <p className="text-xs text-[#9A9490]">{r.date} la {r.time} · {r.guests} persoane</p>
                              {r.eventType && <p className="text-xs text-[#9A9490]">{r.eventType}</p>}
                            </div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0" style={{ background: sm.bg, color: sm.color }}>
                              {sm.label}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ── FIDELIZARE ─────────────────────────────────────────── */}
              {tab === 'fidelizare' && (
                <div className="space-y-4">
                  {!data.loyaltyProfile ? (
                    <p className="text-sm text-[#9A9490] text-center py-8">Niciun profil de fidelizare.</p>
                  ) : (
                    <>
                      {/* Level + stats */}
                      <div className="grid grid-cols-2 gap-3">
                        {(() => {
                          const lc = LEVEL_COLORS[data.loyaltyProfile!.currentLevel] ?? LEVEL_COLORS[1];
                          return (
                            <div className="col-span-2 bg-[#1A1A1A] rounded-lg border border-[#2E2E2E] p-3 flex items-center gap-3">
                              <div style={{ width: 40, height: 40, borderRadius: 8, background: lc.bg, border: `1px solid ${lc.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Star className="h-5 w-5" style={{ color: lc.color }} />
                              </div>
                              <div>
                                <p className="font-semibold text-sm" style={{ color: lc.color }}>{lc.label}</p>
                                {data.loyaltyProfile!.currentTier && (
                                  <p className="text-xs text-[#9A9490]">{data.loyaltyProfile!.currentTier}</p>
                                )}
                                {data.loyaltyProfile!.priorityDelivery && (
                                  <p className="text-xs text-[#FCD34D]">⚡ Livrare prioritară activă</p>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                        {[
                          { label: 'Portofel activ', value: `${data.loyaltyProfile!.walletBalance.toFixed(2)} RON`, color: '#4ADE80' },
                          { label: 'Cashback total', value: `${data.loyaltyProfile!.totalCashbackEarned.toFixed(2)} RON`, color: '#C9A84C' },
                          { label: 'Comenzi eligibile', value: String(data.loyaltyProfile!.totalCompletedOrders), color: '#60A5FA' },
                          { label: 'Cheltuit eligibil', value: `${data.loyaltyProfile!.totalSpentEligible.toFixed(0)} RON`, color: '#A78BFA' },
                        ].map((s) => (
                          <div key={s.label} className="bg-[#1A1A1A] rounded-lg border border-[#2E2E2E] p-3">
                            <p className="text-base font-bold" style={{ color: s.color }}>{s.value}</p>
                            <p className="text-[10px] text-[#9A9490] mt-0.5">{s.label}</p>
                          </div>
                        ))}
                        {data.loyaltyProfile!.welcomeBonusActive && (
                          <div className="col-span-2 bg-purple-500/10 rounded-lg border border-purple-500/20 p-3">
                            <p className="text-xs font-semibold text-purple-400">🎉 Bonus de bun venit activ</p>
                          </div>
                        )}
                        {data.loyaltyProfile!.referralCode && (
                          <div className="col-span-2 bg-[#1A1A1A] rounded-lg border border-[#2E2E2E] p-3">
                            <p className="text-[10px] text-[#9A9490] uppercase tracking-wide mb-1">Cod referral</p>
                            <p className="font-mono text-sm font-bold text-[#C9A84C]">{data.loyaltyProfile!.referralCode}</p>
                          </div>
                        )}
                      </div>

                      {/* Last wallet transactions */}
                      {data.loyaltyProfile!.walletTransactions.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-[#9A9490] uppercase tracking-wide mb-2">Ultimele tranzacții portofel</p>
                          <div className="space-y-1.5">
                            {data.loyaltyProfile!.walletTransactions.map((tx) => {
                              const isCredit = tx.type.includes('EARNED') || tx.type.includes('CREDIT') || tx.type.includes('BONUS') || tx.type.includes('WELCOME');
                              const isDebit = tx.type === 'CREDIT_USED' || tx.type === 'CREDIT_EXPIRED' || tx.type === 'CASHBACK_EXPIRED' || tx.type === 'MANUAL_DEBIT';
                              return (
                                <div key={tx.id} className="flex items-center justify-between bg-[#1A1A1A] rounded-lg border border-[#2E2E2E] px-3 py-2">
                                  <div>
                                    <p className="text-xs font-medium text-[#F0EDE6]">{TX_TYPE_LABELS[tx.type] ?? tx.type}</p>
                                    {tx.description && <p className="text-[10px] text-[#9A9490]">{tx.description}</p>}
                                    <p className="text-[10px] text-[#9A9490]">{fmtDate(tx.createdAt)}</p>
                                  </div>
                                  <span className="text-sm font-bold" style={{ color: isDebit ? '#F87171' : '#4ADE80' }}>
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

              {/* ── REFERRALS ──────────────────────────────────────────── */}
              {tab === 'referrals' && (
                <div className="space-y-3">
                  {data.loyaltyProfile && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#1A1A1A] rounded-lg border border-[#2E2E2E] p-3">
                        <p className="text-lg font-bold text-[#A78BFA]">{data.loyaltyProfile.totalReferrals}</p>
                        <p className="text-[10px] text-[#9A9490]">Utilizatori referiți</p>
                      </div>
                      <div className="bg-[#1A1A1A] rounded-lg border border-[#2E2E2E] p-3">
                        <p className="text-lg font-bold text-[#C9A84C]">{data.loyaltyProfile.referralCashbackEarned.toFixed(2)} RON</p>
                        <p className="text-[10px] text-[#9A9490]">Câștig din referrals</p>
                      </div>
                    </div>
                  )}
                  {data.referralsMade.length === 0 ? (
                    <p className="text-sm text-[#9A9490] text-center py-6">Niciun referral efectuat.</p>
                  ) : (
                    <div className="space-y-2">
                      {data.referralsMade.map((ref) => {
                        const statusColor = ref.status === 'COMPLETED' ? '#4ADE80' : ref.status === 'ACTIVE' ? '#60A5FA' : '#9A9490';
                        return (
                          <div key={ref.id} className="bg-[#1A1A1A] rounded-lg border border-[#2E2E2E] px-3 py-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium text-[#F0EDE6]">{ref.referredUser.name}</p>
                                <p className="text-xs text-[#9A9490]">{ref.referredUser.email}</p>
                                <p className="text-[10px] text-[#9A9490]">{ref.referredOrdersCount} comenzi · {fmtDate(ref.createdAt)}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-bold" style={{ color: statusColor }}>{ref.totalCashbackEarned.toFixed(2)} RON</p>
                                <p className="text-[10px]" style={{ color: statusColor }}>{ref.status}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── ACȚIUNI ADMIN ──────────────────────────────────────── */}
              {tab === 'actiuni' && (
                <div className="space-y-4">
                  {/* Active toggle */}
                  <div className="bg-[#1A1A1A] rounded-lg border border-[#2E2E2E] p-4">
                    <p className="text-xs font-semibold text-[#9A9490] uppercase tracking-wide mb-3">Status cont</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[#F0EDE6] font-medium">{data.isActive ? 'Cont activ' : 'Cont dezactivat'}</p>
                        <p className="text-xs text-[#9A9490]">{data.isActive ? 'Clientul poate folosi aplicația' : 'Clientul nu poate accesa contul'}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={togglingActive}
                        onClick={handleToggleActive}
                        className={`h-8 px-3 text-xs font-semibold border ${
                          data.isActive
                            ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                            : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                        }`}
                      >
                        {togglingActive ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : data.isActive ? (
                          'Dezactivează'
                        ) : (
                          'Activează'
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Admin note */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#9A9490] uppercase tracking-wide">Notă internă</label>
                    <Textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Adaugă o notă internă despre acest utilizator..."
                      rows={4}
                      className="text-sm resize-none bg-[#1A1A1A] border-[#2E2E2E] text-[#F0EDE6] placeholder:text-[#9A9490] focus-visible:ring-[#C9A84C]"
                    />
                    <Button
                      size="sm"
                      className="gap-1.5 bg-[#C9A84C] text-[#0F0F0F] font-bold hover:bg-[#B8963E] border-0"
                      disabled={savingNote}
                      onClick={handleSaveNote}
                    >
                      {savingNote ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" />Se salvează...</>
                      ) : 'Salvează notă'}
                    </Button>
                  </div>

                  {/* Quick links */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[#9A9490] uppercase tracking-wide">Acțiuni rapide</p>
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/admin/utilizatori/${data.id}`}
                        className="flex items-center justify-between bg-[#1A1A1A] rounded-lg border border-[#2E2E2E] px-3 py-2.5 hover:border-[#C9A84C44] transition-colors"
                      >
                        <span className="text-sm text-[#F0EDE6]">Profil complet</span>
                        <ExternalLink className="h-3.5 w-3.5 text-[#9A9490]" />
                      </Link>
                      <Link
                        href={`/admin/comenzi?userId=${data.id}`}
                        className="flex items-center justify-between bg-[#1A1A1A] rounded-lg border border-[#2E2E2E] px-3 py-2.5 hover:border-[#C9A84C44] transition-colors"
                      >
                        <span className="text-sm text-[#F0EDE6]">Toate comenzile clientului</span>
                        <ExternalLink className="h-3.5 w-3.5 text-[#9A9490]" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
