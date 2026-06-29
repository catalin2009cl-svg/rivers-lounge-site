'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, X, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import type { DbCabinPackage } from '@/lib/server-data';
import type { AdminRole } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  initialPackages: DbCabinPackage[];
  role: AdminRole;
}

type FormData = {
  slug: string;
  name: string;
  description: string;
  priceFrom: string;
  duration: string;
  includes: string[];
  idealFor: string[];
  imageUrl: string;
  isActive: boolean;
  order: string;
};

const EMPTY_FORM: FormData = {
  slug: '', name: '', description: '', priceFrom: '',
  duration: '', includes: [''], idealFor: [''],
  imageUrl: '', isActive: true, order: '0',
};

function slugify(s: string) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-');
}

// ── Main component ────────────────────────────────────────────────────────────

export function CabanaAdminClient({ initialPackages, role }: Props) {
  const [packages, setPackages]   = useState<DbCabinPackage[]>(initialPackages);
  const [tab, setTab]             = useState<'pachete' | 'info'>('pachete');
  const [modal, setModal]         = useState<'create' | 'edit' | null>(null);
  const [editId, setEditId]       = useState<string | null>(null);
  const [form, setForm]           = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [deleteId, setDeleteId]   = useState<string | null>(null);

  const canEdit   = hasPermission(role, 'cabana.edit');
  const canDelete = hasPermission(role, 'cabana.delete');

  // ── Refresh ──────────────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    const r = await fetch('/api/admin/cabana/packages');
    if (r.ok) setPackages(await r.json());
  }, []);

  // ── Seed (first load) ─────────────────────────────────────────────────────

  async function handleSeed() {
    const r = await fetch('/api/admin/cabana/seed', { method: 'POST' });
    const d = await r.json();
    if (d.ok) { toast.success(`Importate ${d.inserted} pachete`); refresh(); }
    else toast.info(d.message ?? 'Deja importat');
  }

  // ── Modal helpers ──────────────────────────────────────────────────────────

  function openCreate() {
    const nextOrder = packages.length > 0 ? Math.max(...packages.map(p => p.order)) + 1 : 0;
    setForm({ ...EMPTY_FORM, order: String(nextOrder) });
    setEditId(null);
    setModal('create');
  }

  function openEdit(pkg: DbCabinPackage) {
    setForm({
      slug:        pkg.slug,
      name:        pkg.name,
      description: pkg.description,
      priceFrom:   String(pkg.priceFrom),
      duration:    pkg.duration,
      includes:    pkg.includes.length > 0 ? [...pkg.includes] : [''],
      idealFor:    pkg.idealFor.length > 0 ? [...pkg.idealFor] : [''],
      imageUrl:    pkg.imageUrl ?? '',
      isActive:    pkg.isActive,
      order:       String(pkg.order),
    });
    setEditId(pkg.id);
    setModal('edit');
  }

  function closeModal() { setModal(null); setEditId(null); }

  // ── Save (create / update) ─────────────────────────────────────────────────

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Numele este obligatoriu'); return; }
    if (!form.priceFrom || isNaN(Number(form.priceFrom))) { toast.error('Prețul trebuie să fie un număr'); return; }
    if (!form.duration.trim()) { toast.error('Durata este obligatorie'); return; }

    const slug = form.slug.trim() || slugify(form.name);
    const payload = {
      ...form,
      slug,
      priceFrom: Number(form.priceFrom),
      order:     Number(form.order ?? 0),
      includes:  form.includes.filter(s => s.trim()),
      idealFor:  form.idealFor.filter(s => s.trim()),
    };

    setSaving(true);
    try {
      let r: Response;
      if (modal === 'create') {
        r = await fetch('/api/admin/cabana/packages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        r = await fetch(`/api/admin/cabana/packages/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      if (!r.ok) throw new Error(await r.text());
      toast.success(modal === 'create' ? 'Pachet creat' : 'Pachet actualizat');
      closeModal();
      refresh();
    } catch (e) {
      toast.error(`Eroare: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    const r = await fetch(`/api/admin/cabana/packages/${id}`, { method: 'DELETE' });
    if (r.ok) { toast.success('Pachet șters'); setDeleteId(null); refresh(); }
    else toast.error('Eroare la ștergere');
  }

  // ── Toggle active ──────────────────────────────────────────────────────────

  async function toggleActive(pkg: DbCabinPackage) {
    const r = await fetch(`/api/admin/cabana/packages/${pkg.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...pkg, isActive: !pkg.isActive }),
    });
    if (r.ok) { toast.success(!pkg.isActive ? 'Activat' : 'Dezactivat'); refresh(); }
    else toast.error('Eroare');
  }

  // ── Reorder ────────────────────────────────────────────────────────────────

  async function movePackage(id: string, direction: 'up' | 'down') {
    const sorted = [...packages].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(p => p.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const ids = sorted.map(p => p.id);
    [ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];

    const r = await fetch('/api/admin/cabana/packages/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (r.ok) refresh();
    else toast.error('Eroare la reordonare');
  }

  // ── Dynamic list helpers ───────────────────────────────────────────────────

  function updateListItem(field: 'includes' | 'idealFor', index: number, value: string) {
    setForm(f => {
      const arr = [...f[field]];
      arr[index] = value;
      return { ...f, [field]: arr };
    });
  }

  function addListItem(field: 'includes' | 'idealFor') {
    setForm(f => ({ ...f, [field]: [...f[field], ''] }));
  }

  function removeListItem(field: 'includes' | 'idealFor', index: number) {
    setForm(f => {
      const arr = f[field].filter((_, i) => i !== index);
      return { ...f, [field]: arr.length > 0 ? arr : [''] };
    });
  }

  const sorted = [...packages].sort((a, b) => a.order - b.order);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">🏕️ Cabana Rivers</h1>
          <p className="text-sm text-gray-400 mt-1">Gestionează pachetele și informațiile cabanei</p>
        </div>
        {packages.length === 0 && canEdit && (
          <button
            onClick={handleSeed}
            className="text-xs px-3 py-1.5 rounded-md bg-yellow-600/20 text-yellow-400 border border-yellow-600/30 hover:bg-yellow-600/30 transition-colors"
          >
            Importă pachete default
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#111] rounded-lg p-1 w-fit">
        {(['pachete', 'info'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t === 'pachete' ? 'Pachete' : 'Informații Cabană'}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Pachete ──────────────────────────────────────────────────── */}
      {tab === 'pachete' && (
        <>
          <div className="flex justify-end mb-4">
            {canEdit && (
              <button
                onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C9A84C] text-[#0F0F0F] text-sm font-semibold hover:bg-[#C9A84C]/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Adaugă pachet nou
              </button>
            )}
          </div>

          {sorted.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="mb-3">Nu există pachete în baza de date.</p>
              {canEdit && (
                <button onClick={handleSeed} className="text-sm text-[#C9A84C] underline underline-offset-2">
                  Importă pachetele default din mock-data
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((pkg, idx) => (
                <div
                  key={pkg.id}
                  className={`bg-[#1A1A1A] border rounded-xl p-4 flex items-start gap-4 transition-colors ${
                    pkg.isActive ? 'border-[#2E2E2E]' : 'border-[#2E2E2E] opacity-60'
                  }`}
                >
                  {/* Reorder arrows */}
                  {canEdit && (
                    <div className="flex flex-col gap-0.5 pt-0.5 shrink-0">
                      <button
                        onClick={() => movePackage(pkg.id, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-white/5 disabled:opacity-20 transition-colors text-gray-400"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => movePackage(pkg.id, 'down')}
                        disabled={idx === sorted.length - 1}
                        className="p-1 rounded hover:bg-white/5 disabled:opacity-20 transition-colors text-gray-400"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Package info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-white">{pkg.name}</span>
                      <span className="text-xs text-gray-500 bg-[#111] px-2 py-0.5 rounded-full">{pkg.duration}</span>
                      {!pkg.isActive && <span className="text-xs text-gray-600 bg-[#111] px-2 py-0.5 rounded-full">Inactiv</span>}
                    </div>
                    <p className="text-sm text-gray-400 mb-2 line-clamp-1">{pkg.description}</p>
                    <div className="flex items-center gap-4">
                      <span className="text-[#C9A84C] font-bold text-sm">de la {pkg.priceFrom} RON</span>
                      <span className="text-xs text-gray-600">
                        {pkg.includes.length} incluse · {pkg.idealFor.length} taguri
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {canEdit && (
                      <>
                        <button
                          onClick={() => toggleActive(pkg)}
                          title={pkg.isActive ? 'Dezactivează' : 'Activează'}
                          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          {pkg.isActive
                            ? <ToggleRight className="h-5 w-5 text-green-500" />
                            : <ToggleLeft className="h-5 w-5 text-gray-500" />
                          }
                        </button>
                        <button
                          onClick={() => openEdit(pkg)}
                          title="Editează"
                          className="p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => setDeleteId(pkg.id)}
                        title="Șterge"
                        className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Tab 2: Informații Cabană ────────────────────────────────────────── */}
      {tab === 'info' && <CabanaInfoTab />}

      {/* ── Create / Edit Modal ─────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={closeModal} />
          <div className="relative bg-[#1A1A1A] border border-[#2E2E2E] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#2E2E2E]">
              <h2 className="font-semibold text-white text-lg">
                {modal === 'create' ? 'Pachet nou' : 'Editează pachet'}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Name + Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nume pachet *">
                  <input
                    value={form.name}
                    onChange={e => {
                      const name = e.target.value;
                      setForm(f => ({ ...f, name, slug: f.slug || slugify(name) }));
                    }}
                    placeholder="Weekend Relaxare"
                    className={INPUT}
                  />
                </Field>
                <Field label="Slug (URL)" hint="auto-generat din nume">
                  <input
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                    placeholder="weekend-relax"
                    className={INPUT}
                  />
                </Field>
              </div>

              {/* Description */}
              <Field label="Descriere scurtă">
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  placeholder="Scurtă descriere a pachetului..."
                  className={INPUT}
                />
              </Field>

              {/* Price + Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Preț de la (RON) *">
                  <input
                    type="number"
                    min={0}
                    value={form.priceFrom}
                    onChange={e => setForm(f => ({ ...f, priceFrom: e.target.value }))}
                    placeholder="800"
                    className={INPUT}
                  />
                </Field>
                <Field label="Durată *">
                  <input
                    value={form.duration}
                    onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                    placeholder="2 nopți"
                    className={INPUT}
                  />
                </Field>
              </div>

              {/* Includes */}
              <Field label="Ce include">
                <div className="space-y-2">
                  {form.includes.map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={item}
                        onChange={e => updateListItem('includes', i, e.target.value)}
                        placeholder={`Punct ${i + 1}`}
                        className={`${INPUT} flex-1`}
                      />
                      <button
                        type="button"
                        onClick={() => removeListItem('includes', i)}
                        className="p-2 rounded-lg bg-[#111] text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addListItem('includes')}
                    className="text-xs text-[#C9A84C] hover:underline"
                  >
                    + Adaugă punct
                  </button>
                </div>
              </Field>

              {/* Ideal for */}
              <Field label="Ideal pentru (taguri)">
                <div className="space-y-2">
                  {form.idealFor.map((tag, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={tag}
                        onChange={e => updateListItem('idealFor', i, e.target.value)}
                        placeholder={`Tag ${i + 1}`}
                        className={`${INPUT} flex-1`}
                      />
                      <button
                        type="button"
                        onClick={() => removeListItem('idealFor', i)}
                        className="p-2 rounded-lg bg-[#111] text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addListItem('idealFor')}
                    className="text-xs text-[#C9A84C] hover:underline"
                  >
                    + Adaugă tag
                  </button>
                </div>
              </Field>

              {/* Image URL + Order + Active */}
              <Field label="URL imagine (opțional)">
                <input
                  value={form.imageUrl}
                  onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://..."
                  className={INPUT}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Ordine afișare">
                  <input
                    type="number"
                    min={0}
                    value={form.order}
                    onChange={e => setForm(f => ({ ...f, order: e.target.value }))}
                    className={INPUT}
                  />
                </Field>
                <Field label="Status">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors w-fit ${
                      form.isActive
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-[#111] border-[#2E2E2E] text-gray-500'
                    }`}
                  >
                    {form.isActive
                      ? <><Check className="h-4 w-4" /> Activ</>
                      : <><X className="h-4 w-4" /> Inactiv</>
                    }
                  </button>
                </Field>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-[#2E2E2E]">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg bg-[#111] text-gray-400 text-sm hover:bg-white/5 transition-colors"
              >
                Anulează
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-[#C9A84C] text-[#0F0F0F] text-sm font-semibold hover:bg-[#C9A84C]/90 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Se salvează...' : modal === 'create' ? 'Creează pachet' : 'Salvează modificările'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation dialog ──────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setDeleteId(null)} />
          <div className="relative bg-[#1A1A1A] border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-semibold text-white mb-2">Confirmare ștergere</h3>
            <p className="text-sm text-gray-400 mb-6">
              Ești sigur că vrei să ștergi acest pachet? Acțiunea nu poate fi anulată.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-lg bg-[#111] text-gray-400 text-sm hover:bg-white/5 transition-colors"
              >
                Anulează
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                Șterge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 2: Informații Cabană ──────────────────────────────────────────────────

type Facility = { key: number; name: string; value: string };

let _facilityKey = 100; // monotonically-increasing key generator

const DEFAULT_FACILITIES: Facility[] = [
  { key: 0, name: 'Capacitate',  value: 'până la 12 persoane' },
  { key: 1, name: 'Dormitoare',  value: '3 dormitoare' },
  { key: 2, name: 'Băi',         value: '2 băi complet utilate' },
  { key: 3, name: 'Bucătărie',   value: 'complet echipată' },
  { key: 4, name: 'Grătar',      value: 'zonă de grătar exterior' },
  { key: 5, name: 'Parcare',     value: 'parcare privată' },
  { key: 6, name: 'WiFi',        value: 'internet de mare viteză' },
  { key: 7, name: 'Climatizare', value: 'aer condiționat' },
];

function CabanaInfoTab() {
  const [title, setTitle]       = useState('Cabana Rivers — Locul Perfect pentru Evenimente');
  const [description, setDesc]  = useState('');
  const [facilities, setFac]    = useState<Facility[]>(DEFAULT_FACILITIES);
  const [saving, setSaving]     = useState(false);
  const justAdded               = useRef(false);

  // Load existing config from SiteSettings
  useEffect(() => {
    fetch('/api/admin/cabana/config')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        if (d.title) setTitle(d.title);
        if (d.description) setDesc(d.description);
        if (Array.isArray(d.facilities) && d.facilities.length) {
          setFac(
            // assign stable keys to rows loaded from DB (they have no key field)
            d.facilities.map((f: { name: string; value: string }, i: number) => ({
              key: i,
              name: f.name ?? '',
              value: f.value ?? '',
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  // Focus the name input of the newly added row
  useEffect(() => {
    if (!justAdded.current) return;
    justAdded.current = false;
    const newKey = facilities[facilities.length - 1]?.key;
    if (newKey == null) return;
    const input = document.querySelector<HTMLInputElement>(`input[data-fac-key="${newKey}"]`);
    input?.focus();
  }, [facilities]);

  async function save() {
    setSaving(true);
    try {
      // strip internal key before saving
      const payload = facilities.map(({ name, value }) => ({ name, value }));
      const r = await fetch('/api/admin/cabana/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, facilities: payload }),
      });
      if (r.ok) toast.success('Informații salvate');
      else toast.error('Eroare la salvare');
    } finally {
      setSaving(false);
    }
  }

  function updateFacility(key: number, field: 'name' | 'value', val: string) {
    setFac(prev => prev.map(f => f.key === key ? { ...f, [field]: val } : f));
  }

  function addFacility() {
    const newKey = ++_facilityKey;
    justAdded.current = true;
    setFac(prev => [...prev, { key: newKey, name: '', value: '' }]);
  }

  function removeFacility(key: number) {
    setFac(prev => prev.filter(f => f.key !== key));
  }

  return (
    <div className="max-w-xl space-y-6">
      <Field label="Titlul secțiunii principale">
        <input value={title} onChange={e => setTitle(e.target.value)} className={INPUT} />
      </Field>
      <Field label="Descriere generală (opțional)">
        <textarea value={description} onChange={e => setDesc(e.target.value)} rows={3} className={INPUT} />
      </Field>
      <div>
        <label className={LABEL}>Facilități</label>
        <div className="space-y-2 mt-2">
          {facilities.map((f) => (
            <div key={f.key} className="flex gap-2">
              <input
                data-fac-key={f.key}
                value={f.name}
                onChange={e => updateFacility(f.key, 'name', e.target.value)}
                placeholder="Nume (ex: WiFi)"
                className={`${INPUT} flex-1`}
              />
              <input
                value={f.value}
                onChange={e => updateFacility(f.key, 'value', e.target.value)}
                placeholder="Valoare (ex: internet rapid)"
                className={`${INPUT} flex-1`}
              />
              <button
                type="button"
                onClick={() => removeFacility(f.key)}
                className="p-2 rounded-lg bg-[#111] text-gray-500 hover:text-red-400 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addFacility}
            className="mt-1 text-sm text-[#C9A84C] hover:underline underline-offset-2 font-medium"
          >
            + Adaugă facilitate
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="px-5 py-2 rounded-lg bg-[#C9A84C] text-[#0F0F0F] text-sm font-semibold hover:bg-[#C9A84C]/90 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Se salvează...' : 'Salvează informații'}
      </button>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

const INPUT = 'w-full bg-[#111] border border-[#2E2E2E] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#C9A84C]/50 transition-colors';
const LABEL = 'block text-xs font-medium text-gray-400 mb-1';

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className={LABEL}>
        {label}
        {hint && <span className="ml-1 text-gray-600 font-normal">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

