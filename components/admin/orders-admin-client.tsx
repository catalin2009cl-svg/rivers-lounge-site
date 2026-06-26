'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import { toast } from 'sonner';
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Loader2,
  ShoppingBag,
  MapPin,
  Clock,
  FileText,
  Truck,
  Store,
  Banknote,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { updateOrderStatus, deleteOrder, fetchOrdersForPolling } from '@/lib/actions/orders';
import { openReceipt } from '@/lib/receipt-generator';
import type { Order } from '@/lib/server-data';
import type { AdminRole } from '@/lib/auth';
import { RevenueDashboard } from '@/components/admin/revenue-dashboard';

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

const TABS = [
  { id: 'toate',          label: 'Toate' },
  { id: 'noua',           label: 'Noi' },
  { id: 'confirmata',     label: 'Confirmate' },
  { id: 'in-pregatire',   label: 'În Pregătire' },
  { id: 'livrata',        label: 'Livrate' },
  { id: 'anulata',        label: 'Anulate' },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderNotification {
  id: string;
  orders: Order[];
  soundPlayed?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  initialOrders: Order[];
  filterUserId?: string;
  filterUserName?: string;
  role?: AdminRole;
}

export function OrdersAdminClient({ initialOrders, filterUserId, filterUserName, role = 'admin' }: Props) {
  const [orders, setOrders] = useState<Order[]>(
    filterUserId ? initialOrders.filter((o) => o.userId === filterUserId) : initialOrders
  );
  const [tab, setTab] = useState<TabId>('toate');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [obs, setObs] = useState<Record<string, string>>(
    Object.fromEntries(initialOrders.map((o) => [o.id, o.observation ?? '']))
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savingObsId, setSavingObsId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('rl_admin_sound') !== 'off';
  });
  const [volume, setVolume] = useState<number>(() => {
    if (typeof window === 'undefined') return 0.7;
    return parseFloat(localStorage.getItem('rl_admin_volume') ?? '0.7');
  });
  const [seenOrders, setSeenOrders] = useState<Set<string>>(
    new Set(initialOrders.filter((o) => o.status !== 'noua').map((o) => o.id))
  );
  const knownIdsRef = useRef<Set<string>>(new Set(initialOrders.map((o) => o.id)));
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundEnabledRef = useRef(soundEnabled);
  const volumeRef = useRef(volume);
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);

  // Unlock AudioContext on first user interaction — browsers block audio until a gesture
  useEffect(() => {
    const unlock = () => {
      if (!audioCtxRef.current) {
        try {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch {}
      }
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
    };
    document.addEventListener('click', unlock);
    document.addEventListener('keydown', unlock);
    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
    };
  }, []);

  // ── Audio ────────────────────────────────────────────────────────────────
  function makeDistortionCurve(amount: number): Float32Array {
    const samples = 256;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  function playNotificationSound() {
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      const vol = volumeRef.current;

      const pattern = [
        { freq: 880,  start: 0,   duration: 0.15, nodeVol: 0.6 },
        { freq: 880,  start: 0.2, duration: 0.15, nodeVol: 0.6 },
        { freq: 1100, start: 0.4, duration: 0.3,  nodeVol: 0.8 },
      ];

      function play() {
        pattern.forEach(({ freq, start, duration, nodeVol }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const wave = ctx.createWaveShaper();
          wave.curve = makeDistortionCurve(20);

          osc.connect(wave);
          wave.connect(gain);
          gain.connect(ctx.destination);

          osc.type = 'square';
          osc.frequency.value = freq;

          const scaled = vol * nodeVol;
          gain.gain.setValueAtTime(0, ctx.currentTime + start);
          gain.gain.linearRampToValueAtTime(scaled, ctx.currentTime + start + 0.01);
          gain.gain.linearRampToValueAtTime(scaled * 0.8, ctx.currentTime + start + duration * 0.7);
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + duration);

          osc.start(ctx.currentTime + start);
          osc.stop(ctx.currentTime + start + duration + 0.05);
        });
      }

      if (ctx.state === 'suspended') {
        ctx.resume().then(play).catch(() => {});
      } else {
        play();
      }
    } catch {}
  }

  function ensureAudioCtx() {
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch {}
    }
  }

  function handleSoundToggle() {
    ensureAudioCtx();
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('rl_admin_sound', next ? 'on' : 'off');
    if (next) playNotificationSound();
  }

  function handleVolumeChange(val: number) {
    setVolume(val);
    localStorage.setItem('rl_admin_volume', String(val));
  }

  function handleTestSound() {
    ensureAudioCtx();
    playNotificationSound();
  }

  // ── Notifications ────────────────────────────────────────────────────────
  function addNotification(newOrders: Order[], soundPlayed?: boolean) {
    const notifId = `notif-${Date.now()}`;
    setNotifications((prev) => [...prev, { id: notifId, orders: newOrders, soundPlayed }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    }, 30000);
  }

  function dismissNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  function scrollToOrder(orderId: string) {
    setTab('noua');
    setExpandedId(orderId);
    setSeenOrders((prev) => new Set([...prev, orderId]));
    setTimeout(() => {
      const el = document.getElementById(`order-${orderId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.animation = 'goldPulse 3s ease';
        setTimeout(() => { el.style.animation = ''; }, 3000);
      }
    }, 100);
  }

  // ── Polling ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const freshOrders = await fetchOrdersForPolling();
        console.log('Polling... found orders:', freshOrders.length, 'known:', knownIdsRef.current.size);

        const allNew = freshOrders.filter((o) => !knownIdsRef.current.has(o.id));
        allNew.forEach((o) => knownIdsRef.current.add(o.id));

        if (allNew.length > 0) {
          console.log('NEW ORDERS DETECTED:', allNew.length, allNew.map(o => o.id));

          let soundPlayed = false;
          if (soundEnabledRef.current) {
            const ctx = audioCtxRef.current;
            if (ctx) {
              if (ctx.state === 'suspended') {
                ctx.resume().then(() => playNotificationSound()).catch(() => {});
              } else {
                playNotificationSound();
              }
              soundPlayed = true;
            } else {
              console.warn('AudioContext not initialized — admin must interact with the page first');
            }
          }

          addNotification(allNew, soundPlayed);

          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            allNew.forEach((o) => {
              new Notification('Comandă nouă! 🛒', {
                body: `${o.name} — ${o.total} RON`,
                icon: '/favicon.ico',
              });
            });
          }
        }

        setOrders(
          filterUserId ? freshOrders.filter((o) => o.userId === filterUserId) : freshOrders
        );
      } catch {}
    }, 10000);
    return () => clearInterval(poll);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Page title ───────────────────────────────────────────────────────────
  useEffect(() => {
    const n = orders.filter((o) => o.status === 'noua').length;
    document.title = n > 0
      ? `(${n}) Comenzi noi — Admin Rivers Lounge`
      : 'Comenzi — Admin Rivers Lounge';
    return () => { document.title = "Comenzi | Admin River's Lounge"; };
  }, [orders]);

  // ── Browser notifications permission ────────────────────────────────────
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const filtered =
    tab === 'toate' ? orders : orders.filter((o) => o.status === tab);

  function handleExpand(orderId: string) {
    setExpandedId((prev) => (prev === orderId ? null : orderId));
    setSeenOrders((prev) => new Set([...prev, orderId]));
  }

  async function handleStatus(id: string, status: Order['status']) {
    if (busyId) return;
    setBusyId(id);
    const result = await updateOrderStatus(id, status, obs[id]);
    if (result.success) {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o))
      );
      toast.success('Status actualizat.');
    } else {
      toast.error(result.error ?? 'Eroare la actualizare.');
    }
    setBusyId(null);
  }

  async function handleSaveObs(id: string) {
    if (savingObsId) return;
    setSavingObsId(id);
    const current = orders.find((o) => o.id === id)!;
    const result = await updateOrderStatus(id, current.status, obs[id] ?? '');
    if (result.success) {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, observation: obs[id] ?? '' } : o))
      );
      toast.success('Notă salvată.');
    } else {
      toast.error(result.error ?? 'Eroare la salvare notă.');
    }
    setSavingObsId(null);
  }

  async function handleDelete(id: string) {
    const result = await deleteOrder(id);
    if (result.success) {
      setOrders((prev) => prev.filter((o) => o.id !== id));
      if (expandedId === id) setExpandedId(null);
      toast.success('Comandă ștearsă.');
    } else {
      toast.error(result.error ?? 'Eroare la ștergere.');
    }
  }

  return (
    <>
      {/* CSS keyframes */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(calc(100% + 24px)); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes goldPulse {
          0% { box-shadow: 0 0 0 0 rgba(201,168,76,0.4); background: transparent; }
          30% { box-shadow: 0 0 0 6px rgba(201,168,76,0.25); background: rgba(201,168,76,0.08); }
          60% { box-shadow: 0 0 0 3px rgba(201,168,76,0.1); background: rgba(201,168,76,0.04); }
          100% { box-shadow: 0 0 0 0 rgba(201,168,76,0); background: transparent; }
        }
        @keyframes pulseRow {
          0%, 100% { background: rgba(201,168,76,0.07); box-shadow: inset 0 0 0 1px rgba(201,168,76,0.25); }
          50% { background: rgba(201,168,76,0.16); box-shadow: inset 0 0 0 1px rgba(201,168,76,0.55); }
        }
        .order-row-unseen { animation: pulseRow 2s ease-in-out infinite; cursor: pointer; }
        .order-row-unseen:hover { animation: none; background: rgba(201,168,76,0.12) !important; }
        .order-row-seen { transition: background 0.3s ease; cursor: pointer; }
      `}</style>

      {/* Floating notification cards */}
      <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '12px', pointerEvents: 'none' }}>
        {notifications.map((notif) => {
          const first = notif.orders[0];
          const count = notif.orders.length;
          return (
            <div key={notif.id} style={{
              background: '#1A1A1A',
              border: '1px solid #C9A84C',
              borderLeft: '4px solid #C9A84C',
              borderRadius: '10px',
              padding: '16px 20px',
              minWidth: '320px',
              maxWidth: '380px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              animation: 'slideInRight 0.3s ease',
              pointerEvents: 'auto',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '28px', lineHeight: 1 }}>🛒</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#C9A84C', fontWeight: 700, margin: 0, fontSize: '15px' }}>
                    {count > 1 ? `${count} comenzi noi!` : 'Comandă nouă!'}
                  </p>
                  <p style={{ color: '#F0EDE6', fontSize: '14px', margin: '4px 0 0' }}>
                    {first.name} — {first.total} RON
                    {count > 1 && <span style={{ color: '#9A9490' }}> și {count - 1} alte</span>}
                  </p>
                  <p style={{ color: '#9A9490', fontSize: '12px', margin: '2px 0 0' }}>
                    {first.items.length} {first.items.length === 1 ? 'produs' : 'produse'} · {first.orderType}
                  </p>
                  <p style={{ fontSize: '11px', margin: '4px 0 0', color: notif.soundPlayed ? '#4ADE80' : '#9A9490' }}>
                    {notif.soundPlayed ? '🔔 Sunet redat' : '🔕 Sunet blocat de browser — apasă oriunde pe pagină'}
                  </p>
                </div>
                <button
                  onClick={() => dismissNotification(notif.id)}
                  style={{ background: 'none', border: 'none', color: '#9A9490', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
                >
                  ×
                </button>
              </div>
              <div style={{ marginTop: '12px' }}>
                <button
                  onClick={() => { scrollToOrder(first.id); dismissNotification(notif.id); }}
                  style={{
                    background: '#C9A84C', color: '#0F0F0F', border: 'none',
                    borderRadius: '6px', padding: '7px 14px', fontSize: '13px',
                    fontWeight: 700, cursor: 'pointer', width: '100%',
                  }}
                >
                  Vezi comanda →
                </button>
              </div>
            </div>
          );
        })}
      </div>

    <div className="space-y-6">
      {/* User filter banner */}
      {filterUserId && (
        <div className="flex items-center justify-between bg-[#1A1A1A] border border-[#C9A84C]/30 rounded-xl px-4 py-3">
          <p className="text-sm text-[#F0EDE6]">
            Comenzi filtrate pentru:{' '}
            <span className="text-[#C9A84C] font-semibold">{filterUserName ?? filterUserId}</span>
          </p>
          <a
            href="/admin/comenzi"
            className="text-xs text-[#9A9490] hover:text-[#F0EDE6] underline transition-colors"
          >
            Afișează toate comenzile
          </a>
        </div>
      )}

      {/* Revenue & analytics dashboard */}
      {!filterUserId && <RevenueDashboard allOrders={initialOrders} />}

      {/* Sound toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={handleSoundToggle}
            title={soundEnabled ? 'Dezactivează sunetul notificărilor' : 'Activează sunetul notificărilor (clic pentru a debloca audio)'}
            style={{
              background: 'none',
              border: `1px solid ${soundEnabled ? '#C9A84C' : '#2E2E2E'}`,
              borderRadius: '8px',
              color: soundEnabled ? '#C9A84C' : '#9A9490',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              padding: '5px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            {soundEnabled ? '🔔 Sunet activ' : '🔕 Sunet oprit'}
          </button>
          {soundEnabled && (
            <>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                title={`Volum: ${Math.round(volume * 100)}%`}
                style={{ width: 80, accentColor: '#C9A84C', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 11, color: '#9A9490', minWidth: 28, textAlign: 'right' }}>
                {Math.round(volume * 100)}%
              </span>
              <button
                onClick={handleTestSound}
                title="Testează sunetul"
                style={{
                  background: 'none',
                  border: '1px solid #2E2E2E',
                  borderRadius: '8px',
                  color: '#9A9490',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  padding: '5px 10px',
                  transition: 'all 0.2s',
                }}
              >
                ▶ Test
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap bg-[#1A1A1A] rounded-xl border border-[#2E2E2E] p-1">
        {TABS.map((t) => {
          const count =
            t.id === 'toate' ? orders.length : orders.filter((o) => o.status === t.id).length;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                active
                  ? 'bg-[#C9A84C] text-[#0F0F0F] font-semibold'
                  : 'text-[#9A9490] hover:bg-[#242424] font-medium'
              }`}
            >
              {t.label}
              {count > 0 && (
                <span
                  className={`text-xs rounded-full px-1.5 py-0.5 font-mono leading-none ${
                    active
                      ? 'bg-black/20 text-[#0F0F0F]'
                      : 'bg-[#242424] text-[#9A9490]'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table / list */}
      {filtered.length === 0 ? (
        <div className="bg-[#1A1A1A] rounded-2xl border border-[#2E2E2E] p-12 text-center">
          <ShoppingBag className="h-10 w-10 text-[#2E2E2E] mx-auto mb-3" />
          <p className="text-sm text-[#9A9490]">
            {tab === 'toate'
              ? 'Nicio comandă primită încă. Comenzile plasate prin site apar aici automat.'
              : `Nicio comandă cu statusul "${TABS.find((t) => t.id === tab)?.label}".`}
          </p>
        </div>
      ) : (
        <div className="bg-[#1A1A1A] rounded-2xl border border-[#2E2E2E] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2E2E2E] bg-[#242424]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Nr. / Dată</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Tip</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Produse</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Plată</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const meta = STATUS_META[o.status];
                  const isExpanded = expandedId === o.id;
                  const isBusy = busyId === o.id;

                  const isUnseen = o.status === 'noua' && !seenOrders.has(o.id);

                  return (
                    <Fragment key={o.id}>
                      <tr
                        id={`order-${o.id}`}
                        className={`border-b border-[#2E2E2E] last:border-0 ${isUnseen ? 'order-row-unseen' : 'order-row-seen hover:bg-[#242424]'}`}
                        style={isUnseen ? { borderLeft: '3px solid #C9A84C' } : {}}
                        onClick={() => handleExpand(o.id)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="font-mono text-xs font-semibold text-[#C9A84C]">{o.id}</p>
                          <p className="text-xs text-[#9A9490] mt-0.5">{fmtDateTime(o.createdAt)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#F0EDE6] whitespace-nowrap">{o.name}</p>
                          <p className="text-xs text-[#9A9490] whitespace-nowrap">{o.phone}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {o.orderType === 'livrare' ? (
                            <span
                              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: 'rgba(59,130,246,0.15)', color: '#60A5FA' }}
                            >
                              <Truck className="h-3 w-3" /> Livrare
                            </span>
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
                          <p className="text-xs text-[#F0EDE6]">
                            {o.items.length} {o.items.length === 1 ? 'produs' : 'produse'}
                          </p>
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
                            {o.status === 'noua' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-[#4ADE80] hover:bg-green-500/10 hover:text-[#4ADE80]"
                                disabled={isBusy}
                                onClick={() => handleStatus(o.id, 'confirmata')}
                                title="Confirmă"
                              >
                                {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : '✓ Confirmă'}
                              </Button>
                            )}
                            {o.status === 'confirmata' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-[#FCD34D] hover:bg-yellow-500/10 hover:text-[#FCD34D]"
                                disabled={isBusy}
                                onClick={() => handleStatus(o.id, 'in-pregatire')}
                                title="Marchează în pregătire"
                              >
                                {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : '🍳 Pregătire'}
                              </Button>
                            )}
                            {o.status === 'in-pregatire' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-[#4ADE80] hover:bg-green-500/10 hover:text-[#4ADE80]"
                                disabled={isBusy}
                                onClick={() => handleStatus(o.id, 'livrata')}
                                title="Marchează ca livrată"
                              >
                                {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : '✅ Livrată'}
                              </Button>
                            )}
                            {!['livrata', 'anulata'].includes(o.status) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-[#F87171] hover:bg-red-500/10 hover:text-[#F87171]"
                                disabled={isBusy}
                                onClick={() => handleStatus(o.id, 'anulata')}
                                title="Anulează"
                              >
                                {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : '✗'}
                              </Button>
                            )}
                            {role === 'admin' && <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-xs text-[#9A9490] hover:text-[#F87171] hover:bg-red-500/10"
                                  title="Șterge"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Ștergi comanda {o.id}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Comanda lui {o.name} va fi eliminată definitiv. Acțiunea nu poate fi anulată.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Anulează</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => handleDelete(o.id)}
                                  >
                                    Șterge
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-[#9A9490] hover:text-[#F0EDE6]"
                              onClick={() => handleExpand(o.id)}
                              title={isExpanded ? 'Ascunde detalii' : 'Arată detalii'}
                            >
                              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr key={`${o.id}-detail`} className="bg-[#0F0F0F] border-b border-[#2E2E2E]">
                          <td colSpan={8} className="px-6 py-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                              {o.orderType === 'livrare' && (
                                <Detail icon={<MapPin className="h-3.5 w-3.5" />} label="Adresă livrare">
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
                                </Detail>
                              )}
                              <Detail icon={<Clock className="h-3.5 w-3.5" />} label="Plasată la">
                                {fmtDateTime(o.createdAt)}
                              </Detail>
                              <Detail icon={<Clock className="h-3.5 w-3.5" />} label="Actualizată la">
                                {fmtDateTime(o.updatedAt)}
                              </Detail>
                            </div>

                            {/* Items list */}
                            <div className="mb-5">
                              <p className="text-xs font-semibold text-[#C9A84C] uppercase tracking-wide mb-2">
                                Produse comandate
                              </p>
                              <div className="bg-[#1A1A1A] rounded-lg border border-[#2E2E2E] divide-y divide-[#2E2E2E]">
                                {o.items.map((item) => (
                                  <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
                                    <div>
                                      <p className="text-sm text-[#F0EDE6] font-medium">{item.name}</p>
                                      {item.unit && (
                                        <p className="text-xs text-[#9A9490]">/ {item.unit}</p>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-semibold text-[#C9A84C]">
                                        {item.quantity} × {item.price} RON
                                      </p>
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
                            </div>

                            {o.notes && (
                              <div className="mb-5">
                                <Detail icon={<FileText className="h-3.5 w-3.5" />} label="Mențiuni client">
                                  <span className="whitespace-pre-wrap">{o.notes}</span>
                                </Detail>
                              </div>
                            )}

                            {/* Processed by operators */}
                            {o.processedBy && o.processedBy.length > 0 && (
                              <div className="mb-5 bg-[#1A1A1A] rounded-lg border border-[#2E2E2E] px-4 py-3">
                                <p className="text-xs font-semibold text-[#9A9490] uppercase tracking-wide mb-2">
                                  👷 Procesat de operatori
                                </p>
                                <div className="space-y-1">
                                  {o.processedBy.map((p, i) => (
                                    <div key={i} className="text-sm text-[#F0EDE6]">
                                      <span className="text-[#C9A84C] font-medium">{p.operatorName}</span>
                                      <span className="text-[#9A9490]"> — </span>
                                      <span>{p.action}</span>
                                      <span className="text-[#9A9490] text-xs ml-2">
                                        {new Date(p.timestamp).toLocaleString('ro-RO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Receipt */}
                            <div>
                              <button
                                onClick={() => openReceipt(o)}
                                style={{
                                  background: 'transparent',
                                  border: '1px solid #C9A84C',
                                  color: '#C9A84C',
                                  borderRadius: 6,
                                  padding: '7px 16px',
                                  fontSize: 13,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                }}
                              >
                                📄 Bon comandă
                              </button>
                            </div>

                            {/* Internal observation */}
                            <div className="space-y-2">
                              <label className="text-xs font-semibold text-[#9A9490] uppercase tracking-wide">
                                Notă internă
                              </label>
                              <Textarea
                                value={obs[o.id] ?? ''}
                                onChange={(e) =>
                                  setObs((prev) => ({ ...prev, [o.id]: e.target.value }))
                                }
                                placeholder="Adaugă o notă internă pentru această comandă..."
                                rows={3}
                                className="text-sm resize-none bg-[#1A1A1A] border-[#2E2E2E] text-[#F0EDE6] placeholder:text-[#9A9490] focus-visible:ring-[#C9A84C] focus-visible:border-[#C9A84C]"
                              />
                              <Button
                                size="sm"
                                className="gap-1.5 bg-[#C9A84C] text-[#0F0F0F] font-bold hover:bg-[#B8963E] border-0 shadow-none"
                                disabled={savingObsId === o.id}
                                onClick={() => handleSaveObs(o.id)}
                              >
                                {savingObsId === o.id ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Se salvează...
                                  </>
                                ) : (
                                  'Salvează notă'
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

function Detail({
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
