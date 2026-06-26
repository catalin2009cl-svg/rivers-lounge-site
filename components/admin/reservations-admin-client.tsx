'use client';

import { useState, Fragment } from 'react';
import { toast } from 'sonner';
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Loader2,
  CalendarCheck,
  Users,
  MapPin,
  Clock,
  FileText,
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
import { updateReservationStatus, deleteReservation } from '@/lib/actions/reservations';
import type { Reservation } from '@/lib/server-data';
import type { AdminRole } from '@/lib/auth';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
  );
}

function fmtDate(dateStr: string) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_META: Record<
  Reservation['status'],
  { label: string; emoji: string; bg: string; color: string }
> = {
  noua:           { label: 'Nouă',         emoji: '🔵', bg: 'rgba(59,130,246,0.15)',  color: '#60A5FA' },
  'in-asteptare': { label: 'În așteptare', emoji: '⏳', bg: 'rgba(234,179,8,0.15)',  color: '#FCD34D' },
  acceptata:      { label: 'Acceptată',    emoji: '✅', bg: 'rgba(34,197,94,0.15)',  color: '#4ADE80' },
  refuzata:       { label: 'Refuzată',     emoji: '❌', bg: 'rgba(239,68,68,0.15)',  color: '#F87171' },
};

const TABS = [
  { id: 'toate',        label: 'Toate' },
  { id: 'noua',         label: 'Noi' },
  { id: 'in-asteptare', label: 'În așteptare' },
  { id: 'acceptata',    label: 'Acceptate' },
  { id: 'refuzata',     label: 'Refuzate' },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  initialReservations: Reservation[];
  role?: AdminRole;
}

export function ReservationsAdminClient({ initialReservations, role = 'admin' }: Props) {
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [tab, setTab] = useState<TabId>('toate');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [obs, setObs] = useState<Record<string, string>>(
    Object.fromEntries(initialReservations.map((r) => [r.id, r.observation ?? '']))
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savingObsId, setSavingObsId] = useState<string | null>(null);
  const [clientNote, setClientNote] = useState<Record<string, string>>({});

  const filtered =
    tab === 'toate' ? reservations : reservations.filter((r) => r.status === tab);

  const stats = {
    total: reservations.length,
    noua: reservations.filter((r) => r.status === 'noua').length,
    acceptata: reservations.filter((r) => r.status === 'acceptata').length,
    refuzata: reservations.filter((r) => r.status === 'refuzata').length,
  };

  async function handleStatus(id: string, status: Reservation['status']) {
    if (busyId) return;
    setBusyId(id);
    const current = reservations.find((r) => r.id === id);
    const result = await updateReservationStatus(id, status, obs[id] ?? current?.observation ?? '', clientNote[id] ?? '');
    if (result.success) {
      setReservations((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r
        )
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
    const current = reservations.find((r) => r.id === id)!;
    const result = await updateReservationStatus(id, current.status, obs[id] ?? '');
    if (result.success) {
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, observation: obs[id] ?? '' } : r))
      );
      toast.success('Notă salvată.');
    } else {
      toast.error(result.error ?? 'Eroare la salvare notă.');
    }
    setSavingObsId(null);
  }

  async function handleDelete(id: string) {
    const result = await deleteReservation(id);
    if (result.success) {
      setReservations((prev) => prev.filter((r) => r.id !== id));
      if (expandedId === id) setExpandedId(null);
      toast.success('Rezervare ștearsă.');
    } else {
      toast.error(result.error ?? 'Eroare la ștergere.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total rezervări', value: stats.total,    color: '#F0EDE6' },
          { label: 'Noi',            value: stats.noua,      color: '#60A5FA' },
          { label: 'Acceptate',      value: stats.acceptata, color: '#4ADE80' },
          { label: 'Refuzate',       value: stats.refuzata,  color: '#F87171' },
        ].map((s) => (
          <div key={s.label} className="bg-[#1A1A1A] rounded-xl border border-[#2E2E2E] p-4">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-[#9A9490] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap bg-[#1A1A1A] rounded-xl border border-[#2E2E2E] p-1">
        {TABS.map((t) => {
          const count =
            t.id === 'toate'
              ? reservations.length
              : reservations.filter((r) => r.status === t.id).length;
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
          <CalendarCheck className="h-10 w-10 text-[#2E2E2E] mx-auto mb-3" />
          <p className="text-sm text-[#9A9490]">
            {tab === 'toate'
              ? 'Nicio rezervare primită încă. Rezervările trimise prin site apar aici automat.'
              : `Nicio rezervare cu statusul "${TABS.find((t) => t.id === tab)?.label}".`}
          </p>
        </div>
      ) : (
        <div className="bg-[#1A1A1A] rounded-2xl border border-[#2E2E2E] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2E2E2E] bg-[#242424]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Data solicitării</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Nume / Telefon</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Data ev. / Ora</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Locație</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Pers.</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Tip eveniment</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const meta = STATUS_META[r.status];
                  const isExpanded = expandedId === r.id;
                  const isBusy = busyId === r.id;

                  return (
                    <Fragment key={r.id}>
                      {/* Main row */}
                      <tr
                        className="border-b border-[#2E2E2E] last:border-0 hover:bg-[#242424] transition-colors cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-[#9A9490]">
                          {fmtDateTime(r.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#F0EDE6] whitespace-nowrap">{r.name}</p>
                          <p className="text-xs text-[#9A9490] whitespace-nowrap">{r.phone}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-[#F0EDE6]">{fmtDate(r.date)}</p>
                          <p className="text-xs text-[#9A9490]">{r.time || '—'}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={
                              r.location === 'Cabana Rivers'
                                ? { background: 'rgba(34,197,94,0.15)', color: '#4ADE80' }
                                : { background: 'rgba(59,130,246,0.15)', color: '#60A5FA' }
                            }
                          >
                            {r.location}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-[#F0EDE6] font-mono text-xs">
                          {r.guests}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-[#9A9490]">
                          {r.eventType || <span className="italic">—</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <span
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: meta.bg, color: meta.color }}
                          >
                            {meta.emoji} {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            {r.status !== 'acceptata' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-[#4ADE80] hover:bg-green-500/10 hover:text-[#4ADE80]"
                                disabled={isBusy}
                                onClick={() => handleStatus(r.id, 'acceptata')}
                                title="Acceptă"
                              >
                                {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : '✓'}
                              </Button>
                            )}
                            {r.status !== 'refuzata' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-[#F87171] hover:bg-red-500/10 hover:text-[#F87171]"
                                disabled={isBusy}
                                onClick={() => handleStatus(r.id, 'refuzata')}
                                title="Refuză"
                              >
                                {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : '✗'}
                              </Button>
                            )}
                            {r.status !== 'in-asteptare' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-[#FCD34D] hover:bg-yellow-500/10 hover:text-[#FCD34D]"
                                disabled={isBusy}
                                onClick={() => handleStatus(r.id, 'in-asteptare')}
                                title="Pune în așteptare"
                              >
                                ⏳
                              </Button>
                            )}
                            {role === 'admin' && (
                              <AlertDialog>
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
                                    <AlertDialogTitle>Ștergi rezervarea lui {r.name}?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Aceasta va elimina definitiv rezervarea din istoric. Acțiunea nu poate fi anulată.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Anulează</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={() => handleDelete(r.id)}
                                    >
                                      Șterge
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-[#9A9490] hover:text-[#F0EDE6]"
                              onClick={() => setExpandedId(isExpanded ? null : r.id)}
                              title={isExpanded ? 'Ascunde detalii' : 'Arată detalii'}
                            >
                              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr key={`${r.id}-detail`} className="bg-[#0F0F0F] border-b border-[#2E2E2E]">
                          <td colSpan={8} className="px-6 py-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                              <Detail icon={<FileText className="h-3.5 w-3.5" />} label="Email">
                                <a href={`mailto:${r.email}`} className="text-[#60A5FA] hover:underline">
                                  {r.email}
                                </a>
                              </Detail>
                              <Detail icon={<Clock className="h-3.5 w-3.5" />} label="Creat la">
                                {fmtDateTime(r.createdAt)}
                              </Detail>
                              <Detail icon={<Clock className="h-3.5 w-3.5" />} label="Actualizat la">
                                {fmtDateTime(r.updatedAt)}
                              </Detail>
                              <Detail icon={<Users className="h-3.5 w-3.5" />} label="Persoane">
                                {r.guests}
                              </Detail>
                              <Detail icon={<MapPin className="h-3.5 w-3.5" />} label="Locație">
                                {r.location}
                              </Detail>
                              <Detail icon={<CalendarCheck className="h-3.5 w-3.5" />} label="Tip eveniment">
                                {r.eventType || '—'}
                              </Detail>
                              {r.notes && (
                                <div className="sm:col-span-2 lg:col-span-3">
                                  <Detail icon={<FileText className="h-3.5 w-3.5" />} label="Mențiuni client">
                                    <span className="whitespace-pre-wrap">{r.notes}</span>
                                  </Detail>
                                </div>
                              )}
                            </div>

                            {/* Processed by operators */}
                            {r.processedBy && r.processedBy.length > 0 && (
                              <div className="mb-5 bg-[#1A1A1A] rounded-lg border border-[#2E2E2E] px-4 py-3">
                                <p className="text-xs font-semibold text-[#9A9490] uppercase tracking-wide mb-2">
                                  👷 Procesat de operatori
                                </p>
                                <div className="space-y-1">
                                  {r.processedBy.map((p, i) => (
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

                            {/* Client-visible note for status change */}
                            <div className="space-y-2 mb-4 p-3 rounded-lg border border-[#3B82F6]/20 bg-[#3B82F6]/5">
                              <label className="text-xs font-semibold text-[#60A5FA] uppercase tracking-wide flex items-center gap-1.5">
                                🔔 Mesaj pentru client (apare în notificări)
                              </label>
                              <Textarea
                                value={clientNote[r.id] ?? ''}
                                onChange={(e) =>
                                  setClientNote((prev) => ({ ...prev, [r.id]: e.target.value }))
                                }
                                placeholder="Optional: ex. Ne pare rau, locatia este rezervata in acea zi. - vizibil clientului la schimbarea statusului"
                                rows={2}
                                className="text-sm resize-none bg-[#1A1A1A] border-[#2E2E2E] text-[#F0EDE6] placeholder:text-[#9A9490] focus-visible:ring-[#3B82F6] focus-visible:border-[#3B82F6]"
                              />
                              <p className="text-[11px] text-[#9A9490]">
                                Trimis automat la următoarea modificare de status.
                              </p>
                            </div>

                            {/* Observation (internal note) */}
                            <div className="space-y-2">
                              <label className="text-xs font-semibold text-[#9A9490] uppercase tracking-wide">
                                Notă internă
                              </label>
                              <Textarea
                                value={obs[r.id] ?? ''}
                                onChange={(e) =>
                                  setObs((prev) => ({ ...prev, [r.id]: e.target.value }))
                                }
                                placeholder="Adaugă o notă internă pentru această rezervare..."
                                rows={3}
                                className="text-sm resize-none bg-[#1A1A1A] border-[#2E2E2E] text-[#F0EDE6] placeholder:text-[#9A9490] focus-visible:ring-[#C9A84C] focus-visible:border-[#C9A84C]"
                              />
                              <Button
                                size="sm"
                                className="gap-1.5 bg-[#C9A84C] text-[#0F0F0F] font-bold hover:bg-[#B8963E] border-0 shadow-none"
                                disabled={savingObsId === r.id}
                                onClick={() => handleSaveObs(r.id)}
                              >
                                {savingObsId === r.id ? (
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
