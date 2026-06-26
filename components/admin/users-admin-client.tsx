'use client';

import { useState, useTransition, Fragment } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ChevronDown,
  ChevronUp,
  Search,
  ShoppingBag,
  Loader2,
  UserCheck,
  UserX,
  Trash2,
  Bell,
  RefreshCw,
  AlertTriangle,
  BadgeCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  updateAdminNote,
  toggleUserActive,
  updateUser,
  markRetentionNotified,
  resetUserActivity,
  deleteInactiveUsers,
  verifyUser,
  revokeVerification,
} from '@/lib/actions/users';
import type { User, Order } from '@/lib/server-data';
import type { SafeOperator } from '@/app/admin/(dashboard)/utilizatori/page';
import type { RetentionCheckResult } from '@/lib/data-retention';
import { OperatorsClient } from '@/components/admin/operators-client';
import { formatBirthday } from '@/lib/birthday-utils';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ro-RO', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
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

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

const STATUS_ORDER_META: Record<Order['status'], { label: string; bg: string; color: string }> = {
  noua:           { label: 'Nouă',          bg: 'rgba(59,130,246,0.15)',  color: '#60A5FA' },
  confirmata:     { label: 'Confirmată',    bg: 'rgba(139,92,246,0.15)', color: '#A78BFA' },
  'in-pregatire': { label: 'În Pregătire', bg: 'rgba(234,179,8,0.15)',  color: '#FCD34D' },
  livrata:        { label: 'Livrată',      bg: 'rgba(34,197,94,0.15)',  color: '#4ADE80' },
  anulata:        { label: 'Anulată',      bg: 'rgba(239,68,68,0.15)',  color: '#F87171' },
};

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  initialUsers: User[];
  allOrders: Order[];
  initialOperators: SafeOperator[];
  initialRetentionReport: RetentionCheckResult[];
  canVerify: boolean;
  adminName: string;
}

export function UsersAdminClient({ initialUsers, allOrders, initialOperators, initialRetentionReport, canVerify, adminName }: Props) {
  const [activeTab, setActiveTab] = useState<'clienti' | 'operatori' | 'retentie'>('clienti');
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [notes, setNotes] = useState<Record<string, string>>(
    Object.fromEntries(initialUsers.map((u) => [u.id, u.adminNote ?? '']))
  );
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'orders' | 'spent'>('recent');

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<{ name: string; email: string; phone: string }>({ name: '', email: '', phone: '' });
  const [, startEditTransition] = useTransition();

  // Retention tab state
  const [retentionData, setRetentionData] = useState<RetentionCheckResult[]>(initialRetentionReport);
  const [retentionFilter, setRetentionFilter] = useState<'all' | 'warn' | 'eligible'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [bulkConfirmStep, setBulkConfirmStep] = useState(0);
  const [notifyingId, setNotifyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    verified: users.filter((u) => u.isVerified).length,
    totalOrders: allOrders.length,
    totalRevenue: allOrders
      .filter((o) => o.status !== 'anulata')
      .reduce((sum, o) => sum + (o.total ?? 0), 0),
  };

  const filtered = users
    .filter((u) => {
      if (filterStatus === 'active' && !u.isActive) return false;
      if (filterStatus === 'inactive' && u.isActive) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'orders') return b.totalOrders - a.totalOrders;
      if (sortBy === 'spent') return b.totalSpent - a.totalSpent;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  async function handleSaveNote(id: string) {
    if (savingNoteId) return;
    setSavingNoteId(id);
    const result = await updateAdminNote(id, notes[id] ?? '');
    if (result.success) {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, adminNote: notes[id] ?? '' } : u)));
      toast.success('Notă salvată.');
    } else {
      toast.error(result.error ?? 'Eroare la salvare.');
    }
    setSavingNoteId(null);
  }

  async function handleToggleActive(id: string, current: boolean) {
    if (togglingId) return;
    setTogglingId(id);
    const result = await toggleUserActive(id, !current);
    if (result.success) {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isActive: !current } : u)));
      toast.success(current ? 'Cont dezactivat.' : 'Cont activat.');
    } else {
      toast.error(result.error ?? 'Eroare la actualizare.');
    }
    setTogglingId(null);
  }

  function startEdit(u: User) {
    setEditingId(u.id);
    setEditFields({ name: u.name, email: u.email, phone: u.phone ?? '' });
  }

  function handleSaveEdit(id: string) {
    startEditTransition(async () => {
      const result = await updateUser(id, {
        name: editFields.name.trim(),
        email: editFields.email.trim(),
        phone: editFields.phone.trim(),
      });
      if (result.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === id
              ? { ...u, name: editFields.name.trim(), email: editFields.email.trim(), phone: editFields.phone.trim() }
              : u
          )
        );
        toast.success('Date actualizate.');
        setEditingId(null);
      } else {
        toast.error(result.error ?? 'Eroare la actualizare.');
      }
    });
  }

  // ── Verify handlers ───────────────────────────────────────────────────────

  async function handleVerify(id: string) {
    setVerifyingId(id);
    const result = await verifyUser(id, adminName);
    if (result.success) {
      const now = new Date().toISOString();
      setUsers((prev) =>
        prev.map((u) => u.id === id ? { ...u, isVerified: true, verifiedAt: now, verifiedBy: adminName } : u)
      );
      toast.success('Cont verificat.');
    } else {
      toast.error(result.error ?? 'Eroare.');
    }
    setVerifyingId(null);
  }

  async function handleRevoke(id: string) {
    setVerifyingId(id);
    const result = await revokeVerification(id);
    if (result.success) {
      setUsers((prev) =>
        prev.map((u) => u.id === id ? { ...u, isVerified: false, verifiedAt: undefined, verifiedBy: undefined } : u)
      );
      toast.success('Verificare revocată.');
    } else {
      toast.error(result.error ?? 'Eroare.');
    }
    setVerifyingId(null);
  }

  // ── CSV export ────────────────────────────────────────────────────────────

  function exportUsersCSV() {
    const BOM = '﻿';

    function escapeCSV(val: string | number | undefined): string {
      const str = String(val ?? '');
      if (str.includes(';') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    }

    const headers = [
      'Nume', 'Email', 'Telefon', 'Data înregistrării',
      'Comenzi', 'Total cheltuit (RON)', 'Ultima comandă',
      'Status', 'Cod Client', 'Notă admin',
    ];

    const rows = filtered.map((u) => [
      escapeCSV(u.name),
      escapeCSV(u.email),
      escapeCSV(u.phone || ''),
      escapeCSV(new Date(u.createdAt).toLocaleDateString('ro-RO')),
      escapeCSV(u.totalOrders || 0),
      escapeCSV(u.totalSpent || 0),
      escapeCSV(u.lastOrderAt ? new Date(u.lastOrderAt).toLocaleDateString('ro-RO') : '—'),
      escapeCSV(u.isActive ? 'Activ' : 'Inactiv'),
      escapeCSV((u as any).clientCode || ''),
      escapeCSV(u.adminNote || ''),
    ].join(';'));

    const csv = BOM + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `utilizatori-riverslounge-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ── Delivery addresses helper ─────────────────────────────────────────────

  function getDeliveryAddresses(userId: string) {
    const userOrders = allOrders.filter(
      (o) => o.userId === userId && o.orderType === 'livrare' && o.address
    );
    const counts: Record<string, number> = {};
    for (const o of userOrders) {
      const key = [o.address, o.city, o.addressDetails].filter(Boolean).join(', ');
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }

  // ── Retention handlers ────────────────────────────────────────────────────

  async function handleSendNotification(r: RetentionCheckResult) {
    setNotifyingId(r.userId);
    const deleteDate = new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(r.deleteAfter));
    const subject = encodeURIComponent('Contul tău Rivers Lounge va fi șters în curând');
    const body = encodeURIComponent(
      `Bună ziua, ${r.name}!\n\n` +
      `Îți scriem pentru a te informa că contul tău de pe riverslounge.ro nu a fost folosit de ${r.daysSinceActivity} de zile.\n\n` +
      `Conform politicii noastre de retenție a datelor (GDPR), conturile inactive vor fi șterse pe data de ${deleteDate}.\n\n` +
      `Pentru a păstra contul, te rugăm să te loghezi pe site:\n` +
      `https://riverslounge.ro/cont/autentificare\n\n` +
      `Dacă nu dorești să păstrezi contul, nu trebuie să faci nimic. Datele tale vor fi șterse automat.\n\n` +
      `Cu respect,\nEchipa Rivers Lounge\nrenetrading@yahoo.com\nriverslounge.ro`
    );
    window.open(`mailto:${r.email}?subject=${subject}&body=${body}`);
    const result = await markRetentionNotified(r.userId);
    if (result.success) {
      setRetentionData((prev) =>
        prev.map((u) =>
          u.userId === r.userId
            ? { ...u, status: 'notify_pending' as const, retentionNotifiedAt: new Date().toISOString() }
            : u
        )
      );
      toast.success('Notificare trimisă și cont marcat.');
    }
    setNotifyingId(null);
  }

  async function handleDeleteUser(userId: string) {
    setDeletingId(userId);
    const result = await deleteInactiveUsers([userId]);
    if (result.deleted > 0) {
      setRetentionData((prev) => prev.filter((u) => u.userId !== userId));
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success('Cont șters și comenzile anonimizate.');
    } else {
      toast.error(result.errors[0] ?? 'Eroare la ștergere.');
    }
    setDeletingId(null);
    setConfirmDeleteId(null);
  }

  async function handleBulkDelete(eligibleIds: string[]) {
    setBulkDeleting(true);
    const result = await deleteInactiveUsers(eligibleIds);
    if (result.deleted > 0) {
      setRetentionData((prev) => prev.filter((u) => !eligibleIds.includes(u.userId)));
      setUsers((prev) => prev.filter((u) => !eligibleIds.includes(u.id)));
      toast.success(`${result.deleted} conturi șterse și comenzile anonimizate.`);
    }
    if (result.errors.length > 0) {
      toast.error(`Erori: ${result.errors.join(', ')}`);
    }
    setBulkDeleting(false);
    setBulkConfirmStep(0);
  }

  async function handleResetActivity(userId: string) {
    setResettingId(userId);
    const result = await resetUserActivity(userId);
    if (result.success) {
      setRetentionData((prev) =>
        prev.map((u) =>
          u.userId === userId
            ? {
                ...u,
                lastActivityAt: new Date().toISOString(),
                daysSinceActivity: 0,
                status: 'active' as const,
                daysUntilDeletion: u.totalOrders > 0 ? 730 : 365,
                retentionNotifiedAt: undefined,
              }
            : u
        )
      );
      toast.success('Activitate resetată. Contul este acum activ.');
    } else {
      toast.error(result.error ?? 'Eroare.');
    }
    setResettingId(null);
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────

  const tabs = [
    { id: 'clienti' as const, label: '👥 Clienți', count: users.length as number | null },
    { id: 'operatori' as const, label: '👷 Operatori', count: initialOperators.length as number | null },
    { id: 'retentie' as const, label: '🗑️ Retenție Date', count: null as number | null },
  ];

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #2E2E2E', gap: 0 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #C9A84C' : '2px solid transparent',
              color: activeTab === tab.id ? '#F0EDE6' : '#9A9490',
              fontWeight: activeTab === tab.id ? 600 : 400,
              fontSize: 14,
              padding: '10px 20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'color 0.15s',
            }}
          >
            {tab.label}
            {tab.count !== null && (
              <span style={{
                background: activeTab === tab.id ? '#C9A84C22' : '#2E2E2E',
                color: activeTab === tab.id ? '#C9A84C' : '#9A9490',
                borderRadius: 999,
                padding: '1px 8px',
                fontSize: 12,
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── OPERATORI TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'operatori' && (
        <OperatorsClient initialOperators={initialOperators} />
      )}

      {/* ── RETENȚIE DATE TAB ─────────────────────────────────────────────── */}
      {activeTab === 'retentie' && (() => {
        const warnData = retentionData.filter((r) => r.status === 'warn_soon' || r.status === 'notify_pending');
        const eligibleData = retentionData.filter((r) => r.status === 'eligible_deletion');
        const activeData = retentionData.filter((r) => r.status === 'active' && r.daysSinceActivity < 180);
        const inactiveData = retentionData.filter((r) => r.status === 'active' && r.daysSinceActivity >= 180);

        const filtered =
          retentionFilter === 'warn' ? warnData :
          retentionFilter === 'eligible' ? eligibleData :
          retentionData;

        const statusMeta: Record<RetentionCheckResult['status'], { label: string; bg: string; color: string }> = {
          active:            { label: 'Activ',              bg: 'rgba(34,197,94,0.12)',   color: '#4ADE80' },
          warn_soon:         { label: 'Aproape de expirare', bg: 'rgba(234,179,8,0.15)',   color: '#FCD34D' },
          notify_pending:    { label: 'Notificare trimisă',  bg: 'rgba(249,115,22,0.15)',  color: '#FB923C' },
          eligible_deletion: { label: 'Eligibil ștergere',  bg: 'rgba(239,68,68,0.15)',   color: '#F87171' },
        };

        return (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Conturi active', value: activeData.length, color: '#4ADE80' },
                { label: 'Inactive (6-12 luni)', value: inactiveData.length, color: '#FCD34D' },
                { label: 'Aproape de ștergere', value: warnData.length, color: '#FB923C' },
                { label: 'Eligibile ștergere', value: eligibleData.length, color: '#F87171' },
              ].map((s) => (
                <div key={s.label} className="bg-[#1A1A1A] rounded-xl border border-[#2E2E2E] p-4">
                  <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs text-[#9A9490] mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Filter + Bulk actions */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                {([
                  { id: 'all', label: 'Toate' },
                  { id: 'warn', label: 'Aproape de ștergere ⚠️' },
                  { id: 'eligible', label: 'Eligibile ștergere 🗑️' },
                ] as const).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setRetentionFilter(f.id)}
                    className="px-3 py-1.5 text-xs rounded-lg transition-colors"
                    style={{
                      background: retentionFilter === f.id ? '#C9A84C22' : '#1A1A1A',
                      color: retentionFilter === f.id ? '#C9A84C' : '#9A9490',
                      border: `1px solid ${retentionFilter === f.id ? '#C9A84C44' : '#2E2E2E'}`,
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {eligibleData.length > 0 && (
                <div className="flex items-center gap-2">
                  {bulkConfirmStep === 0 && (
                    <button
                      onClick={() => setBulkConfirmStep(1)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Șterge toate eligibile ({eligibleData.length})
                    </button>
                  )}
                  {bulkConfirmStep === 1 && (
                    <div className="flex items-center gap-2 bg-[#1A1A1A] border border-red-500/40 rounded-lg px-3 py-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                      <span className="text-xs text-red-300">Sigur? {eligibleData.length} conturi vor fi șterse permanent.</span>
                      <button
                        onClick={() => setBulkConfirmStep(2)}
                        className="text-xs font-bold text-red-400 hover:text-red-300 ml-1"
                      >
                        Da, confirmă
                      </button>
                      <button
                        onClick={() => setBulkConfirmStep(0)}
                        className="text-xs text-[#9A9490] hover:text-[#F0EDE6]"
                      >
                        Anulează
                      </button>
                    </div>
                  )}
                  {bulkConfirmStep === 2 && (
                    <button
                      onClick={() => handleBulkDelete(eligibleData.map((r) => r.userId))}
                      disabled={bulkDeleting}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 font-bold"
                    >
                      {bulkDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      Confirmă ștergerea finală
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
              <div className="bg-[#1A1A1A] rounded-2xl border border-[#2E2E2E] p-12 text-center">
                <p className="text-sm text-[#9A9490]">Niciun cont în această categorie.</p>
              </div>
            ) : (
              <div className="bg-[#1A1A1A] rounded-2xl border border-[#2E2E2E] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#2E2E2E] bg-[#242424]">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide">Utilizator</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Ultima activitate</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Zile inactive</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Comenzi</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Ștergere după</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide">Acțiuni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => {
                        const sm = statusMeta[r.status];
                        const isConfirmingDelete = confirmDeleteId === r.userId;
                        const isNotifying = notifyingId === r.userId;
                        const isDeleting = deletingId === r.userId;
                        const isResetting = resettingId === r.userId;
                        return (
                          <tr key={r.userId} className="border-b border-[#2E2E2E] last:border-0 hover:bg-[#242424] transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium text-[#F0EDE6] whitespace-nowrap">{r.name}</p>
                              <p className="text-xs text-[#9A9490]">{r.email}</p>
                            </td>
                            <td className="px-4 py-3 text-xs text-[#9A9490] whitespace-nowrap">
                              {new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(r.lastActivityAt))}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className="text-sm font-semibold"
                                style={{ color: r.daysSinceActivity > 300 ? '#F87171' : r.daysSinceActivity > 180 ? '#FCD34D' : '#9A9490' }}
                              >
                                {r.daysSinceActivity}
                              </span>
                              <span className="text-xs text-[#9A9490] ml-1">zile</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400">
                                {r.totalOrders}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs whitespace-nowrap">
                              {r.daysUntilDeletion > 0 ? (
                                <span className="text-[#9A9490]">
                                  {new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(r.deleteAfter))}
                                  <span className="text-xs ml-1" style={{ color: r.daysUntilDeletion < 30 ? '#FB923C' : '#9A9490' }}>
                                    ({r.daysUntilDeletion} zile)
                                  </span>
                                </span>
                              ) : (
                                <span className="text-red-400 font-medium">Expirat</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: sm.bg, color: sm.color }}
                              >
                                {sm.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {isConfirmingDelete ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-red-300">Confirmi ștergerea?</span>
                                  <button
                                    onClick={() => handleDeleteUser(r.userId)}
                                    disabled={isDeleting}
                                    className="text-xs font-bold text-red-400 hover:text-red-300"
                                  >
                                    {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Da'}
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="text-xs text-[#9A9490] hover:text-[#F0EDE6]"
                                  >
                                    Nu
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs text-[#60A5FA] hover:bg-blue-500/10"
                                    disabled={isNotifying}
                                    onClick={() => handleSendNotification(r)}
                                    title="Trimite notificare"
                                  >
                                    {isNotifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs text-[#4ADE80] hover:bg-green-500/10"
                                    disabled={isResetting}
                                    onClick={() => handleResetActivity(r.userId)}
                                    title="Marchează activ"
                                  >
                                    {isResetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs text-[#F87171] hover:bg-red-500/10"
                                    onClick={() => setConfirmDeleteId(r.userId)}
                                    title="Șterge cont"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* ── CLIENȚI TAB ───────────────────────────────────────────────────── */}
      {activeTab === 'clienti' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: 'Total utilizatori', value: stats.total,                   color: '#F0EDE6' },
              { label: 'Conturi active',    value: stats.active,                  color: '#4ADE80' },
              { label: '✓ Verificați',      value: stats.verified,                color: '#60A5FA' },
              { label: 'Total comenzi',     value: stats.totalOrders,             color: '#A78BFA' },
              { label: 'Venit total (RON)', value: stats.totalRevenue.toFixed(0), color: '#C9A84C' },
            ].map((s) => (
              <div key={s.label} className="bg-[#1A1A1A] rounded-xl border border-[#2E2E2E] p-4">
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs text-[#9A9490] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A9490]" />
              <Input
                placeholder="Caută după nume, email sau telefon..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-[#1A1A1A] border-[#2E2E2E] text-[#F0EDE6] placeholder:text-[#9A9490] focus-visible:ring-[#C9A84C]"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="bg-[#1A1A1A] border border-[#2E2E2E] text-[#F0EDE6] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
            >
              <option value="all">Toți utilizatorii</option>
              <option value="active">Activi</option>
              <option value="inactive">Inactivi</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-[#1A1A1A] border border-[#2E2E2E] text-[#F0EDE6] text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
            >
              <option value="recent">Cel mai recent</option>
              <option value="oldest">Cel mai vechi</option>
              <option value="orders">Comenzi (desc)</option>
              <option value="spent">Cheltuieli (desc)</option>
            </select>
            <button
              type="button"
              onClick={exportUsersCSV}
              className="bg-[#1A1A1A] border border-[#2E2E2E] text-[#9A9490] hover:text-[#F0EDE6] hover:border-[#C9A84C] text-sm rounded-lg px-3 py-2 transition-colors whitespace-nowrap"
            >
              📥 Exportă CSV ({filtered.length})
            </button>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="bg-[#1A1A1A] rounded-2xl border border-[#2E2E2E] p-12 text-center">
              <ShoppingBag className="h-10 w-10 text-[#2E2E2E] mx-auto mb-3" />
              <p className="text-sm text-[#9A9490]">
                {users.length === 0
                  ? 'Niciun utilizator înregistrat încă. Utilizatorii apar aici după ce își creează cont pe site.'
                  : 'Niciun utilizator găsit pentru criteriile selectate.'}
              </p>
            </div>
          ) : (
            <div className="bg-[#1A1A1A] rounded-2xl border border-[#2E2E2E] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2E2E2E] bg-[#242424]">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide">Utilizator</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Telefon</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Înregistrat</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Comenzi</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Cheltuit</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Ultima comandă</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#9A9490] uppercase tracking-wide whitespace-nowrap">Acțiuni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => {
                      const isExpanded = expandedId === u.id;
                      const isBusy = togglingId === u.id;
                      const userOrders = allOrders.filter((o) => o.userId === u.id);
                      const deliveryAddresses = getDeliveryAddresses(u.id);

                      return (
                        <Fragment key={u.id}>
                          <tr
                            className="border-b border-[#2E2E2E] last:border-0 hover:bg-[#242424] transition-colors cursor-pointer"
                            onClick={() => setExpandedId(isExpanded ? null : u.id)}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {u.avatar ? (
                                  <img
                                    src={u.avatar}
                                    alt={u.name}
                                    style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #C9A84C', flexShrink: 0 }}
                                  />
                                ) : (
                                  <div
                                    style={{ width: 36, height: 36, borderRadius: '50%', background: '#C9A84C', color: '#0F0F0F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}
                                  >
                                    {initials(u.name)}
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-[#F0EDE6] whitespace-nowrap">{u.name}</p>
                                  <p className="text-xs text-[#9A9490] whitespace-nowrap">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-[#9A9490] whitespace-nowrap">{u.phone || '—'}</td>
                            <td className="px-4 py-3 text-xs text-[#9A9490] whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                                style={{ background: 'rgba(59,130,246,0.15)', color: '#60A5FA' }}
                              >
                                {u.totalOrders}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-sm font-semibold text-[#C9A84C]">{u.totalSpent} RON</span>
                            </td>
                            <td className="px-4 py-3 text-xs text-[#9A9490] whitespace-nowrap">
                              {u.lastOrderAt ? fmtRelative(u.lastOrderAt) : '—'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <div className="flex flex-col gap-1">
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full font-medium w-fit"
                                  style={
                                    u.isActive
                                      ? { background: 'rgba(34,197,94,0.15)', color: '#4ADE80' }
                                      : { background: 'rgba(239,68,68,0.15)', color: '#F87171' }
                                  }
                                >
                                  {u.isActive ? 'Activ' : 'Inactiv'}
                                </span>
                                {u.isVerified ? (
                                  <span className="text-xs px-2 py-0.5 rounded-full font-medium w-fit"
                                    style={{ background: 'rgba(59,130,246,0.15)', color: '#60A5FA' }}>
                                    ✓ Verificat
                                  </span>
                                ) : (
                                  <span className="text-xs text-[#4E4E4E]">Neverificat</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className={`h-7 px-2 text-xs ${
                                    u.isActive
                                      ? 'text-[#F87171] hover:bg-red-500/10 hover:text-[#F87171]'
                                      : 'text-[#4ADE80] hover:bg-green-500/10 hover:text-[#4ADE80]'
                                  }`}
                                  disabled={isBusy}
                                  onClick={() => handleToggleActive(u.id, u.isActive)}
                                  title={u.isActive ? 'Dezactivează' : 'Activează'}
                                >
                                  {isBusy ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : u.isActive ? (
                                    <UserX className="h-3.5 w-3.5" />
                                  ) : (
                                    <UserCheck className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                                {canVerify && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className={`h-7 px-2 text-xs ${
                                      u.isVerified
                                        ? 'text-[#60A5FA] hover:text-[#F87171] hover:bg-red-500/10'
                                        : 'text-[#4E4E4E] hover:text-[#60A5FA] hover:bg-blue-500/10'
                                    }`}
                                    disabled={verifyingId === u.id}
                                    onClick={() => u.isVerified ? handleRevoke(u.id) : handleVerify(u.id)}
                                    title={u.isVerified ? 'Revocă verificarea' : 'Verifică cont'}
                                  >
                                    {verifyingId === u.id
                                      ? <Loader2 className="h-3 w-3 animate-spin" />
                                      : <BadgeCheck className="h-3.5 w-3.5" />
                                    }
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-xs text-[#9A9490] hover:text-[#F0EDE6]"
                                  onClick={() => setExpandedId(isExpanded ? null : u.id)}
                                  title={isExpanded ? 'Ascunde' : 'Detalii'}
                                >
                                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </Button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded row */}
                          {isExpanded && (
                            <tr className="bg-[#0F0F0F] border-b border-[#2E2E2E]">
                              <td colSpan={8} className="px-6 py-5 space-y-5">

                                {/* Inline edit form */}
                                {editingId === u.id ? (
                                  <div className="bg-[#1A1A1A] rounded-xl border border-[#C9A84C33] p-4 space-y-3">
                                    <p className="text-xs font-semibold text-[#C9A84C] uppercase tracking-wide mb-2">Editare date</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                      <label className="text-xs text-[#9A9490]">
                                        Nume complet
                                        <Input
                                          className="mt-1 bg-[#0F0F0F] border-[#2E2E2E] text-[#F0EDE6] focus-visible:ring-[#C9A84C]"
                                          value={editFields.name}
                                          onChange={(e) => setEditFields((p) => ({ ...p, name: e.target.value }))}
                                        />
                                      </label>
                                      <label className="text-xs text-[#9A9490]">
                                        Email
                                        <Input
                                          className="mt-1 bg-[#0F0F0F] border-[#2E2E2E] text-[#F0EDE6] focus-visible:ring-[#C9A84C]"
                                          value={editFields.email}
                                          onChange={(e) => setEditFields((p) => ({ ...p, email: e.target.value }))}
                                        />
                                      </label>
                                      <label className="text-xs text-[#9A9490]">
                                        Telefon
                                        <Input
                                          className="mt-1 bg-[#0F0F0F] border-[#2E2E2E] text-[#F0EDE6] focus-visible:ring-[#C9A84C]"
                                          value={editFields.phone}
                                          onChange={(e) => setEditFields((p) => ({ ...p, phone: e.target.value }))}
                                        />
                                      </label>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        className="bg-[#C9A84C] text-[#0F0F0F] font-bold hover:bg-[#B8963E] border-0"
                                        onClick={() => handleSaveEdit(u.id)}
                                      >
                                        Salvează
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-[#9A9490]"
                                        onClick={() => setEditingId(null)}
                                      >
                                        Anulează
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {[
                                      { label: 'Nume', value: u.name },
                                      { label: 'Email', value: u.email },
                                      { label: 'Telefon', value: u.phone || '—' },
                                      { label: 'Înregistrat', value: fmtDate(u.createdAt) },
                                      { label: 'Total comenzi', value: String(u.totalOrders) },
                                      { label: 'Total cheltuit', value: `${u.totalSpent} RON` },
                                      { label: 'Ultima comandă', value: u.lastOrderAt ? fmtRelative(u.lastOrderAt) : '—' },
                                      { label: 'Rol', value: u.role === 'admin' ? 'Administrator' : 'Client' },
                                    ].map((item) => (
                                      <div key={item.label}>
                                        <p className="text-xs text-[#9A9490] mb-0.5">{item.label}</p>
                                        <p className="text-sm text-[#F0EDE6] font-medium">{item.value}</p>
                                      </div>
                                    ))}
                                    <div className="col-span-2 sm:col-span-4">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-[#C9A84C] border border-[#C9A84C44] hover:bg-[#C9A84C11] h-7 px-3 text-xs"
                                        onClick={() => startEdit(u)}
                                      >
                                        ✎ Editează date
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {/* Delivery addresses */}
                                {deliveryAddresses.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-[#C9A84C] uppercase tracking-wide mb-2">
                                      Adrese de livrare
                                    </p>
                                    <div className="flex flex-col gap-1.5">
                                      {deliveryAddresses.map(([address, count], idx) => (
                                        <div
                                          key={address}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            background: idx === 0 ? 'rgba(201,168,76,0.08)' : '#1A1A1A',
                                            border: idx === 0 ? '1px solid rgba(201,168,76,0.25)' : '1px solid #2E2E2E',
                                            borderRadius: 6,
                                            padding: '6px 12px',
                                          }}
                                        >
                                          <span className="text-sm text-[#F0EDE6]">
                                            {idx === 0 && <span className="text-[#C9A84C] mr-1.5">★</span>}
                                            {address}
                                          </span>
                                          <span className="text-xs text-[#9A9490] ml-4 shrink-0">{count}x</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Order history */}
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-semibold text-[#C9A84C] uppercase tracking-wide">
                                      Istoric comenzi
                                    </p>
                                    {userOrders.length > 0 && (
                                      <Link
                                        href={`/admin/comenzi?userId=${u.id}`}
                                        className="text-xs text-[#60A5FA] hover:underline"
                                      >
                                        Vezi toate comenzile →
                                      </Link>
                                    )}
                                  </div>
                                  {userOrders.length === 0 ? (
                                    <p className="text-xs text-[#9A9490] italic">
                                      Nicio comandă asociată acestui cont.
                                    </p>
                                  ) : (
                                    <div className="bg-[#1A1A1A] rounded-lg border border-[#2E2E2E] overflow-hidden">
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="bg-[#242424] border-b border-[#2E2E2E]">
                                            <th className="text-left px-3 py-2 text-[#9A9490] font-semibold uppercase tracking-wide">Data</th>
                                            <th className="text-left px-3 py-2 text-[#9A9490] font-semibold uppercase tracking-wide">ID Comandă</th>
                                            <th className="text-left px-3 py-2 text-[#9A9490] font-semibold uppercase tracking-wide">Produse</th>
                                            <th className="text-left px-3 py-2 text-[#9A9490] font-semibold uppercase tracking-wide">Total</th>
                                            <th className="text-left px-3 py-2 text-[#9A9490] font-semibold uppercase tracking-wide">Status</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {userOrders.slice(0, 10).map((o) => {
                                            const sm = STATUS_ORDER_META[o.status];
                                            return (
                                              <tr key={o.id} className="border-b border-[#2E2E2E] last:border-0 hover:bg-[#242424]">
                                                <td className="px-3 py-2 text-[#9A9490] whitespace-nowrap">
                                                  {new Date(o.createdAt).toLocaleDateString('ro-RO')}
                                                </td>
                                                <td className="px-3 py-2 font-mono text-[#C9A84C] whitespace-nowrap">{o.id}</td>
                                                <td className="px-3 py-2 text-[#F0EDE6]">
                                                  {o.items[0]?.name}
                                                  {o.items.length > 1 && (
                                                    <span className="text-[#9A9490]"> +{o.items.length - 1}</span>
                                                  )}
                                                </td>
                                                <td className="px-3 py-2 text-[#C9A84C] font-semibold whitespace-nowrap">
                                                  {o.total} RON
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                  <span
                                                    className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                                                    style={{ background: sm.bg, color: sm.color }}
                                                  >
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

                                {/* Verification card */}
                                {canVerify && (
                                  <div className="bg-[#1A1A1A] rounded-xl border border-[#2E2E2E] p-4">
                                    {u.isVerified ? (
                                      <div className="flex items-start justify-between gap-4">
                                        <div>
                                          <div className="flex items-center gap-2 mb-1.5">
                                            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                                              <circle cx="8" cy="8" r="8" fill="#3B82F6"/>
                                              <path d="M5 8L7 10L11 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            <span className="text-sm font-semibold text-[#60A5FA]">Cont Verificat</span>
                                          </div>
                                          {u.verifiedAt && (
                                            <p className="text-xs text-[#9A9490]">
                                              Verificat pe: {new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(u.verifiedAt))}
                                            </p>
                                          )}
                                          {u.verifiedBy && (
                                            <p className="text-xs text-[#9A9490]">Verificat de: {u.verifiedBy}</p>
                                          )}
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="text-[#9A9490] hover:text-[#F87171] hover:bg-red-500/10 text-xs h-7 px-3 shrink-0"
                                          disabled={verifyingId === u.id}
                                          onClick={() => handleRevoke(u.id)}
                                        >
                                          {verifyingId === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Revocă ×'}
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="flex items-start justify-between gap-4">
                                        <div>
                                          <div className="flex items-center gap-2 mb-1">
                                            <div style={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px solid #4E4E4E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4E4E4E' }} />
                                            </div>
                                            <span className="text-sm font-semibold text-[#9A9490]">Cont Neverificat</span>
                                          </div>
                                          <p className="text-xs text-[#9A9490]">Clientul nu a primit încă verificarea</p>
                                        </div>
                                        <Button
                                          size="sm"
                                          className="shrink-0 text-xs h-7 px-3"
                                          style={{ background: 'rgba(59,130,246,0.12)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.3)' }}
                                          disabled={verifyingId === u.id}
                                          onClick={() => handleVerify(u.id)}
                                        >
                                          {verifyingId === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : '✓ Verifică acest cont'}
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Birthday info */}
                                {u.birthday && (
                                  <div className="bg-[#1A1A1A] rounded-xl border border-[#2E2E2E] p-4">
                                    <p className="text-xs font-semibold text-[#9A9490] uppercase tracking-wide mb-2">Aniversar</p>
                                    <div className="flex items-start gap-3 flex-wrap">
                                      <div className="flex items-center gap-2">
                                        <span className="text-base">🎂</span>
                                        <span className="text-sm text-[#F0EDE6]">{formatBirthday(u.birthday)}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Admin note */}
                                <div className="space-y-2">
                                  <label className="text-xs font-semibold text-[#9A9490] uppercase tracking-wide">
                                    Notă internă
                                  </label>
                                  <Textarea
                                    value={notes[u.id] ?? ''}
                                    onChange={(e) =>
                                      setNotes((prev) => ({ ...prev, [u.id]: e.target.value }))
                                    }
                                    placeholder="Adaugă o notă internă despre acest utilizator..."
                                    rows={3}
                                    className="text-sm resize-none bg-[#1A1A1A] border-[#2E2E2E] text-[#F0EDE6] placeholder:text-[#9A9490] focus-visible:ring-[#C9A84C]"
                                  />
                                  <Button
                                    size="sm"
                                    className="gap-1.5 bg-[#C9A84C] text-[#0F0F0F] font-bold hover:bg-[#B8963E] border-0 shadow-none"
                                    disabled={savingNoteId === u.id}
                                    onClick={() => handleSaveNote(u.id)}
                                  >
                                    {savingNoteId === u.id ? (
                                      <><Loader2 className="h-3.5 w-3.5 animate-spin" />Se salvează...</>
                                    ) : 'Salvează notă'}
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
        </>
      )}
    </div>
  );
}
