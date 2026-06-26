'use client';

import { useState, useTransition } from 'react';
import {
  Search,
  Download,
  Trash2,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ShieldCheck,
  FileJson,
  Plus,
  RefreshCw,
  User,
  Mail,
  Phone,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import {
  addGdprRequest,
  updateGdprRequestStatus,
  processGdprDelete,
} from '@/lib/actions/gdpr';
import type { GdprRequest, GdprRequestType } from '@/lib/actions/gdpr';
import { updateUser } from '@/lib/actions/users';
import type { User as UserType } from '@/lib/server-data';
import type { Order, Reservation } from '@/lib/server-data';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  initialUsers: UserType[];
  allOrders: Order[];
  allReservations: Reservation[];
  initialRequests: GdprRequest[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const REQUEST_TYPE_LABELS: Record<GdprRequestType, string> = {
  delete: 'Drept ștergere (Art. 17)',
  access: 'Drept acces (Art. 15)',
  portability: 'Portabilitate (Art. 20)',
  rectification: 'Rectificare (Art. 16)',
  objection: 'Drept opoziție (Art. 21)',
};

const REQUEST_TYPE_COLORS: Record<GdprRequestType, string> = {
  delete: 'bg-red-500/10 text-red-500',
  access: 'bg-blue-500/10 text-blue-400',
  portability: 'bg-purple-500/10 text-purple-400',
  rectification: 'bg-yellow-500/10 text-yellow-500',
  objection: 'bg-orange-500/10 text-orange-400',
};

function deadlineInfo(deadline: string, status: string) {
  if (status !== 'pending') return null;
  const daysLeft = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (daysLeft > 7) return { label: `${daysLeft} zile`, cls: 'text-green-500' };
  if (daysLeft > 0) return { label: `⚠️ ${daysLeft} zile`, cls: 'text-yellow-500' };
  return { label: '🔴 DEPĂȘIT', cls: 'text-red-500 font-bold' };
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GdprAdminClient({ initialUsers, allOrders, allReservations, initialRequests }: Props) {
  const [isPending, startTransition] = useTransition();

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [foundUser, setFoundUser] = useState<UserType | null>(null);
  const [searchError, setSearchError] = useState('');

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({ name: '', email: '', phone: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);

  // Delete confirm
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Requests
  const [requests, setRequests] = useState<GdprRequest[]>(initialRequests);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReq, setNewReq] = useState({
    requesterEmail: '',
    requesterName: '',
    type: 'access' as GdprRequestType,
    notes: '',
  });
  const [addingReq, setAddingReq] = useState(false);

  // ── Search ──────────────────────────────────────────────────────────────────

  function handleSearch() {
    const q = searchQuery.trim().toLowerCase();
    if (!q) { setSearchError('Introduceți un email sau un nume.'); return; }
    const found = initialUsers.find(
      (u) => u.email.toLowerCase() === q || u.name.toLowerCase().includes(q)
    );
    if (found) {
      setFoundUser(found);
      setSearchError('');
      setDeleteStep(0);
      setEditMode(false);
      setEditSuccess(false);
    } else {
      setFoundUser(null);
      setSearchError('Niciun utilizator găsit cu acest email sau nume.');
    }
  }

  // ── Export ──────────────────────────────────────────────────────────────────

  function handleExportCSV() {
    if (!foundUser) return;
    const userOrders = allOrders.filter(
      (o) => (o.userEmail ?? '').toLowerCase() === foundUser.email.toLowerCase()
    );
    const userReservations = allReservations.filter(
      (r) => r.email.toLowerCase() === foundUser.email.toLowerCase()
    );

    const lines: string[] = [
      '# DATE PERSONALE EXPORTATE — RIVERS LOUNGE',
      `# Data exportului: ${new Date().toISOString()}`,
      `# Utilizator: ${foundUser.name} <${foundUser.email}>`,
      '',
      '## PROFIL',
      'Câmp,Valoare',
      `Nume,${foundUser.name}`,
      `Email,${foundUser.email}`,
      `Telefon,${foundUser.phone ?? 'N/A'}`,
      `Cont creat,${new Date(foundUser.createdAt).toLocaleDateString('ro-RO')}`,
      `Ultima autentificare,${foundUser.lastLoginAt ? new Date(foundUser.lastLoginAt).toLocaleDateString('ro-RO') : 'N/A'}`,
      `Total comenzi,${foundUser.totalOrders}`,
      `Total cheltuit,${foundUser.totalSpent} RON`,
      '',
      '## COMENZI',
      'ID,Data,Produse,Total,Status',
      ...userOrders.map((o) =>
        `${o.id},${new Date(o.createdAt).toLocaleDateString('ro-RO')},"${o.items.map((i) => `${i.name} x${i.quantity}`).join('; ')}",${o.total} RON,${o.status}`
      ),
      '',
      '## REZERVĂRI',
      'ID,Data,Locație,Tip eveniment,Status',
      ...userReservations.map((r) =>
        `${r.id},${new Date(r.createdAt).toLocaleDateString('ro-RO')},${r.location},${r.eventType},${r.status}`
      ),
    ];

    downloadBlob(lines.join('\n'), `gdpr-export-${foundUser.id}.csv`, 'text/csv;charset=utf-8;');
  }

  function handleExportJSON() {
    if (!foundUser) return;
    const userOrders = allOrders.filter(
      (o) => (o.userEmail ?? '').toLowerCase() === foundUser.email.toLowerCase()
    );
    const userReservations = allReservations.filter(
      (r) => r.email.toLowerCase() === foundUser.email.toLowerCase()
    );

    const payload = {
      exportedAt: new Date().toISOString(),
      controller: "River's Lounge",
      dataSubject: {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        phone: foundUser.phone,
        createdAt: foundUser.createdAt,
        lastLoginAt: foundUser.lastLoginAt,
        lastActivityAt: foundUser.lastActivityAt,
        totalOrders: foundUser.totalOrders,
        totalSpent: foundUser.totalSpent,
      },
      orders: userOrders,
      reservations: userReservations,
    };

    downloadBlob(JSON.stringify(payload, null, 2), `gdpr-export-${foundUser.id}.json`, 'application/json');
  }

  // ── Edit ────────────────────────────────────────────────────────────────────

  function startEdit() {
    if (!foundUser) return;
    setEditFields({ name: foundUser.name, email: foundUser.email, phone: foundUser.phone ?? '' });
    setEditMode(true);
    setEditSuccess(false);
  }

  async function handleSaveEdit() {
    if (!foundUser) return;
    setEditSaving(true);
    const res = await updateUser(foundUser.id, {
      name: editFields.name,
      email: editFields.email,
      phone: editFields.phone,
    });
    setEditSaving(false);
    if (res.success) {
      setFoundUser({ ...foundUser, name: editFields.name, email: editFields.email, phone: editFields.phone });
      setEditMode(false);
      setEditSuccess(true);
      setTimeout(() => setEditSuccess(false), 3000);
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!foundUser) return;
    setDeleting(true);
    setDeleteError('');
    const res = await processGdprDelete(foundUser.id, foundUser.email);
    setDeleting(false);
    if (res.success) {
      // Add the auto-created completed request to local state
      const now = new Date().toISOString();
      const autoReq: GdprRequest = {
        id: `GDPR-auto-${Date.now()}`,
        receivedAt: now,
        deadline: now,
        requesterEmail: foundUser.email,
        requesterName: 'Procesare admin',
        type: 'delete',
        status: 'completed',
        notes: 'Cont și date personale șterse de administrator.',
        processedAt: now,
        relatedUserId: foundUser.id,
      };
      setRequests((prev) => [autoReq, ...prev]);
      setFoundUser(null);
      setDeleteStep(0);
      setSearchQuery('');
    } else {
      setDeleteError(res.error ?? 'Eroare la ștergere.');
      setDeleteStep(0);
    }
  }

  // ── Add GDPR request ────────────────────────────────────────────────────────

  async function handleAddRequest() {
    if (!newReq.requesterEmail || !newReq.requesterName) return;
    setAddingReq(true);
    const res = await addGdprRequest({
      ...newReq,
      relatedUserId: foundUser?.id,
    });
    setAddingReq(false);
    if (res.success && res.request) {
      setRequests((prev) => [res.request!, ...prev]);
      setShowAddForm(false);
      setNewReq({ requesterEmail: '', requesterName: '', type: 'access', notes: '' });
    }
  }

  // ── Mark request status ──────────────────────────────────────────────────────

  function handleMarkStatus(id: string, status: 'completed' | 'rejected') {
    startTransition(async () => {
      const res = await updateGdprRequestStatus(id, status);
      if (res.success) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, status, processedAt: new Date().toISOString() } : r
          )
        );
      }
    });
  }

  // ── Counts ───────────────────────────────────────────────────────────────────

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const overdueCount = requests.filter(
    (r) => r.status === 'pending' && new Date(r.deadline) < new Date()
  ).length;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Cereri active', value: pendingCount, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Depășite (30 zile)', value: overdueCount, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Total cereri', value: requests.length, icon: ShieldCheck, color: 'text-primary', bg: 'bg-primary/10' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/10 p-5">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search section */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/10 p-6">
        <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          Caută utilizator
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Email sau nume utilizator..."
            className="flex-1 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:border-primary"
          />
          <button
            onClick={handleSearch}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Search className="h-4 w-4" />
            Caută
          </button>
        </div>
        {searchError && (
          <p className="mt-2 text-sm text-red-400">{searchError}</p>
        )}

        {/* Found user card */}
        {foundUser && (
          <div className="mt-6 border border-primary/20 rounded-xl p-5 bg-primary/5">
            {!editMode ? (
              <>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{foundUser.name}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <Mail className="h-3.5 w-3.5" />
                        {foundUser.email}
                      </p>
                      {foundUser.phone && (
                        <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <Phone className="h-3.5 w-3.5" />
                          {foundUser.phone}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Cont creat: {new Date(foundUser.createdAt).toLocaleDateString('ro-RO')} ·{' '}
                        {foundUser.totalOrders} comenzi · {foundUser.totalSpent} RON
                      </p>
                    </div>
                  </div>
                  {editSuccess && (
                    <span className="text-xs text-green-500 flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Salvat
                    </span>
                  )}
                </div>

                {/* GDPR action buttons */}
                {deleteStep === 0 && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleExportCSV}
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Exportă CSV
                    </button>
                    <button
                      onClick={handleExportJSON}
                      className="flex items-center gap-1.5 px-3 py-2 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded-lg text-xs font-medium transition-colors"
                    >
                      <FileJson className="h-3.5 w-3.5" />
                      Exportă JSON
                    </button>
                    <button
                      onClick={startEdit}
                      className="flex items-center gap-1.5 px-3 py-2 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Rectifică date
                    </button>
                    <button
                      onClick={() => { setDeleteStep(1); setDeleteError(''); }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Șterge cont & date
                    </button>
                  </div>
                )}

                {/* Delete confirm flow */}
                {deleteStep === 1 && (
                  <div className="mt-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-sm font-semibold text-red-400 mb-2">
                      ⚠️ Confirmare ștergere — această acțiune este ireversibilă
                    </p>
                    <p className="text-xs text-gray-400 mb-4">
                      Contul <strong className="text-gray-200">{foundUser.name}</strong> va fi șters.
                      Comenzile și rezervările vor fi anonimizate (retenție fiscală 5 ani).
                    </p>
                    {deleteError && <p className="text-xs text-red-400 mb-2">{deleteError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDeleteStep(2)}
                        className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-xs font-medium transition-colors"
                      >
                        Da, confirmă ștergerea
                      </button>
                      <button
                        onClick={() => setDeleteStep(0)}
                        className="px-4 py-2 bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 rounded-lg text-xs font-medium transition-colors"
                      >
                        Anulează
                      </button>
                    </div>
                  </div>
                )}

                {deleteStep === 2 && (
                  <div className="mt-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-sm font-semibold text-red-400 mb-2">
                      🔴 Ultimă confirmare — scrieți &quot;STERGE&quot; pentru a continua
                    </p>
                    <FinalDeleteConfirm
                      onConfirm={handleDelete}
                      onCancel={() => setDeleteStep(0)}
                      loading={deleting}
                    />
                  </div>
                )}
              </>
            ) : (
              /* Edit form */
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <Edit2 className="h-4 w-4 text-yellow-500" />
                  Rectificare date (Art. 16 GDPR)
                </p>
                <div className="space-y-3">
                  {(['name', 'email', 'phone'] as const).map((field) => (
                    <div key={field}>
                      <label className="text-xs text-gray-400 mb-1 block capitalize">{field === 'phone' ? 'Telefon' : field === 'name' ? 'Nume' : 'Email'}</label>
                      <input
                        type={field === 'email' ? 'email' : 'text'}
                        value={editFields[field]}
                        onChange={(e) => setEditFields((prev) => ({ ...prev, [field]: e.target.value }))}
                        className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-primary"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleSaveEdit}
                    disabled={editSaving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {editSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Salvează
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-500/10 text-gray-400 rounded-lg text-xs font-medium hover:bg-gray-500/20 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    Anulează
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Requests log */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/10">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Registru cereri GDPR ({requests.length})
          </h2>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-medium transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Adaugă cerere manuală
          </button>
        </div>

        {/* Add request form */}
        {showAddForm && (
          <div className="p-5 border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-[#111]">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Cerere nouă GDPR</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Nume solicitant</label>
                <input
                  type="text"
                  value={newReq.requesterName}
                  onChange={(e) => setNewReq((p) => ({ ...p, requesterName: e.target.value }))}
                  placeholder="Numele complet"
                  className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Email solicitant</label>
                <input
                  type="email"
                  value={newReq.requesterEmail}
                  onChange={(e) => setNewReq((p) => ({ ...p, requesterEmail: e.target.value }))}
                  placeholder="email@exemplu.ro"
                  className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Tip cerere</label>
                <select
                  value={newReq.type}
                  onChange={(e) => setNewReq((p) => ({ ...p, type: e.target.value as GdprRequestType }))}
                  className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-primary"
                >
                  {(Object.entries(REQUEST_TYPE_LABELS) as [GdprRequestType, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Notițe</label>
                <input
                  type="text"
                  value={newReq.notes}
                  onChange={(e) => setNewReq((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Detalii suplimentare..."
                  className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddRequest}
                disabled={addingReq || !newReq.requesterEmail || !newReq.requesterName}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {addingReq ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Adaugă
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-500/10 text-gray-400 rounded-lg text-xs font-medium hover:bg-gray-500/20 transition-colors"
              >
                Anulează
              </button>
            </div>
          </div>
        )}

        {/* Requests table */}
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <ShieldCheck className="h-10 w-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Nicio cerere GDPR înregistrată.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10">
                  {['Solicitant', 'Tip', 'Status', 'Primit', 'Termen', 'Acțiuni'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const dl = deadlineInfo(req.deadline, req.status);
                  return (
                    <tr key={req.id} className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-800 dark:text-gray-200">{req.requesterName}</p>
                        <p className="text-xs text-gray-400">{req.requesterEmail}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${REQUEST_TYPE_COLORS[req.type]}`}>
                          {REQUEST_TYPE_LABELS[req.type]}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {req.status === 'pending' && (
                          <span className="flex items-center gap-1 text-xs text-yellow-500">
                            <Clock className="h-3.5 w-3.5" />
                            În așteptare
                          </span>
                        )}
                        {req.status === 'completed' && (
                          <span className="flex items-center gap-1 text-xs text-green-500">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Finalizat
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="flex items-center gap-1 text-xs text-red-400">
                            <XCircle className="h-3.5 w-3.5" />
                            Respins
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400">
                        {new Date(req.receivedAt).toLocaleDateString('ro-RO')}
                      </td>
                      <td className="px-5 py-3">
                        {dl ? (
                          <span className={`text-xs font-medium ${dl.cls}`}>{dl.label}</span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {req.processedAt ? new Date(req.processedAt).toLocaleDateString('ro-RO') : '—'}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {req.status === 'pending' && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleMarkStatus(req.id, 'completed')}
                              disabled={isPending}
                              title="Marchează finalizat"
                              className="p-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleMarkStatus(req.id, 'rejected')}
                              disabled={isPending}
                              title="Marchează respins"
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── FinalDeleteConfirm sub-component ──────────────────────────────────────────

function FinalDeleteConfirm({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [val, setVal] = useState('');
  return (
    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Scrieți STERGE"
        className="bg-[#1a1a1a] border border-red-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 w-40"
      />
      <button
        onClick={onConfirm}
        disabled={val !== 'STERGE' || loading}
        className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 disabled:opacity-40 transition-colors"
      >
        {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        Șterge definitiv
      </button>
      <button
        onClick={onCancel}
        disabled={loading}
        className="px-4 py-2 bg-gray-500/10 text-gray-400 rounded-lg text-xs font-medium hover:bg-gray-500/20 transition-colors"
      >
        Anulează
      </button>
    </div>
  );
}
