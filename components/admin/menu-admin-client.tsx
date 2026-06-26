'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Plus, Pencil, Trash2, Star, UtensilsCrossed,
  Search, X, ChevronDown, Save, Undo2, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import type { MenuProduct } from '@/lib/server-data';
import type { AdminRole } from '@/lib/auth';
import { createMenuItem, updateMenuItem, deleteMenuItem, updateMenuItemStatus } from '@/lib/actions/menu';
import { ImagePickerField } from './image-picker-field';

// ── Types ─────────────────────────────────────────────────────────────────────

type MenuStatus = 'disponibil' | 'indisponibil' | 'retras' | 'draft';

interface InlineEdit {
  name: string;
  price: number;
  unit: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<MenuStatus, { label: string; icon: string; className: string }> = {
  disponibil:   { label: 'Disponibil',   icon: '✅', className: 'bg-green-500/10 text-green-400 border border-green-500/20' },
  indisponibil: { label: 'Indisponibil', icon: '⏸️', className: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' },
  retras:       { label: 'Retras',       icon: '📦', className: 'bg-gray-500/10 text-gray-400 border border-gray-500/20' },
  draft:        { label: 'Draft',        icon: '📝', className: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
};

const STATUS_ORDER: MenuStatus[] = ['disponibil', 'indisponibil', 'retras', 'draft'];

const CATEGORY_LABELS: Record<string, string> = {
  food: 'Mâncare',
  drinks: 'Băuturi',
  desserts: 'Deserturi',
};

const SUBCATEGORY_MAP: Record<string, { value: string; label: string }[]> = {
  food: [
    { value: 'bruschete', label: 'Bruschete' },
    { value: 'salate', label: 'Salate' },
    { value: 'supe', label: 'Supe' },
    { value: 'fel-principal', label: 'Fel Principal' },
    { value: 'pizza', label: 'Pizza Al Forno' },
    { value: 'paste', label: 'Paste Barilla' },
    { value: 'fructe-de-mare', label: 'Fructe de Mare' },
    { value: 'platouri', label: 'Platouri Reci' },
    { value: 'focaccia-paine', label: 'Focaccia & Pâine' },
    { value: 'garnituri', label: 'Garnituri' },
    { value: 'sosuri', label: 'Sosuri' },
    { value: 'specialitati', label: 'Specialități' },
  ],
  drinks: [
    { value: 'bauturi', label: 'Băuturi & Răcoritoare' },
    { value: 'cocktailuri', label: 'Cocktailuri' },
    { value: 'vinuri', label: 'Vinuri' },
    { value: 'bere', label: 'Bere' },
  ],
  desserts: [
    { value: 'deserturi', label: 'Deserturi' },
    { value: 'cakeshop', label: 'International Cakeshop' },
  ],
};

const SUBCATEGORY_LABELS: Record<string, string> = Object.values(SUBCATEGORY_MAP)
  .flat()
  .reduce<Record<string, string>>((acc, { value, label }) => ({ ...acc, [value]: label }), {});

const UNIT_OPTIONS = [
  'porție', '100g', '250g', '500g', '1kg',
  '330ml', '500ml', '1L', '150ml', 'bucată', 'set',
];

const EMPTY_FORM: Omit<MenuProduct, 'id'> = {
  name: '',
  description: '',
  price: 0,
  unit: 'porție',
  category: 'food',
  subcategory: 'bruschete',
  image: '',
  popular: false,
  available: true,
  status: 'disponibil',
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface MenuAdminClientProps {
  initialItems: MenuProduct[];
  role?: AdminRole;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MenuAdminClient({ initialItems, role = 'admin' }: MenuAdminClientProps) {
  const [items, setItems] = useState<MenuProduct[]>(initialItems);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [exitEditConfirm, setExitEditConfirm] = useState(false);
  const [editItem, setEditItem] = useState<MenuProduct | null>(null);
  const [form, setForm] = useState<Omit<MenuProduct, 'id'>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickEditMode, setQuickEditMode] = useState(false);
  const [inlineEdits, setInlineEdits] = useState<Record<string, InlineEdit>>({});
  const [savingRows, setSavingRows] = useState<Record<string, boolean>>({});

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function getItemStatus(item: MenuProduct): MenuStatus {
    return (item.status as MenuStatus) ?? (item.available ? 'disponibil' : 'indisponibil');
  }

  function rowHasChanges(item: MenuProduct): boolean {
    const edit = inlineEdits[item.id];
    if (!edit) return false;
    return (
      edit.name !== item.name ||
      edit.price !== item.price ||
      edit.unit !== (item.unit ?? 'porție')
    );
  }

  // ── Quick-edit mode ──────────────────────────────────────────────────────────

  function enterQuickEdit() {
    const edits: Record<string, InlineEdit> = {};
    for (const item of items) {
      edits[item.id] = { name: item.name, price: item.price, unit: item.unit ?? 'porție' };
    }
    setInlineEdits(edits);
    setQuickEditMode(true);
  }

  function tryExitQuickEdit() {
    if (items.some(rowHasChanges)) {
      setExitEditConfirm(true);
    } else {
      setQuickEditMode(false);
      setInlineEdits({});
    }
  }

  function confirmExitQuickEdit() {
    setQuickEditMode(false);
    setInlineEdits({});
    setExitEditConfirm(false);
  }

  function updateInlineField(id: string, field: keyof InlineEdit, value: string | number) {
    setInlineEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  function cancelInlineRow(item: MenuProduct) {
    setInlineEdits(prev => ({
      ...prev,
      [item.id]: { name: item.name, price: item.price, unit: item.unit ?? 'porție' },
    }));
  }

  async function saveInlineRow(item: MenuProduct) {
    const edit = inlineEdits[item.id];
    if (!edit) return;
    if (!edit.name.trim()) return toast.error('Numele produsului este obligatoriu.');
    if (edit.price <= 0) return toast.error('Prețul trebuie să fie mai mare de 0.');
    setSavingRows(prev => ({ ...prev, [item.id]: true }));
    try {
      const result = await updateMenuItem(item.id, {
        name: edit.name.trim(),
        price: edit.price,
        unit: edit.unit,
      });
      if (!result.success) throw new Error(result.error);
      setItems(prev => prev.map(i => i.id === item.id ? result.data! : i));
      setInlineEdits(prev => ({
        ...prev,
        [item.id]: { name: result.data!.name, price: result.data!.price, unit: result.data!.unit ?? 'porție' },
      }));
      toast.success('✅ Produs actualizat');
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSavingRows(prev => ({ ...prev, [item.id]: false }));
    }
  }

  // ── Optimistic actions ───────────────────────────────────────────────────────

  async function handleStatusChange(id: string, status: MenuStatus) {
    const prev = items;
    setItems(p => p.map(i => i.id === id ? { ...i, status, available: status === 'disponibil' } : i));
    const result = await updateMenuItemStatus(id, status);
    if (!result.success) { setItems(prev); toast.error('Eroare la actualizare status.'); }
  }

  async function togglePopular(item: MenuProduct) {
    const newPopular = !item.popular;
    const prev = items;
    setItems(p => p.map(i => i.id === item.id ? { ...i, popular: newPopular } : i));
    const result = await updateMenuItem(item.id, { popular: newPopular });
    if (!result.success) { setItems(prev); toast.error('Eroare la actualizare.'); }
  }

  // ── Dialog ───────────────────────────────────────────────────────────────────

  function openCreate() {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(item: MenuProduct) {
    setEditItem(item);
    const itemStatus = getItemStatus(item);
    setForm({
      name: item.name,
      description: item.description,
      price: item.price,
      unit: item.unit ?? 'porție',
      category: item.category,
      subcategory: item.subcategory ?? SUBCATEGORY_MAP[item.category][0].value,
      image: item.image,
      popular: item.popular,
      available: itemStatus === 'disponibil',
      status: itemStatus,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return toast.error('Numele produsului este obligatoriu.');
    if (form.price <= 0) return toast.error('Prețul trebuie să fie mai mare de 0.');
    setSaving(true);
    try {
      const payload = { ...form, available: form.status === 'disponibil' };
      if (editItem) {
        const result = await updateMenuItem(editItem.id, payload);
        if (!result.success) throw new Error(result.error);
        setItems(prev => prev.map(i => i.id === editItem.id ? result.data! : i));
        if (quickEditMode && result.data) {
          setInlineEdits(prev => ({
            ...prev,
            [result.data!.id]: { name: result.data!.name, price: result.data!.price, unit: result.data!.unit ?? 'porție' },
          }));
        }
        toast.success('Produs actualizat!');
      } else {
        const result = await createMenuItem(payload);
        if (!result.success) throw new Error(result.error);
        setItems(prev => [...prev, result.data!]);
        if (quickEditMode && result.data) {
          setInlineEdits(prev => ({
            ...prev,
            [result.data!.id]: { name: result.data!.name, price: result.data!.price, unit: result.data!.unit ?? 'porție' },
          }));
        }
        toast.success('Produs adăugat!');
      }
      setDialogOpen(false);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    const result = await deleteMenuItem(deleteId);
    if (result.success) {
      setItems(prev => prev.filter(i => i.id !== deleteId));
      if (quickEditMode) {
        setInlineEdits(prev => { const n = { ...prev }; delete n[deleteId]; return n; });
      }
      toast.success('Produs șters.');
    } else {
      toast.error(result.error ?? 'Eroare la ștergere.');
    }
    setDeleteId(null);
  }

  // ── Derived state ────────────────────────────────────────────────────────────

  const statusCounts = STATUS_ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = items.filter(i => getItemStatus(i) === s).length;
    return acc;
  }, {});

  const q = searchQuery.trim().toLowerCase();
  const filtered = items.filter(item => {
    const catMatch = filterCategory === 'all' || item.category === filterCategory;
    const statusMatch = filterStatus === 'all' || getItemStatus(item) === filterStatus;
    const searchMatch = !q ||
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      (item.subcategory ?? '').toLowerCase().includes(q) ||
      (SUBCATEGORY_LABELS[item.subcategory ?? ''] ?? '').toLowerCase().includes(q);
    return catMatch && statusMatch && searchMatch;
  });

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8 pt-20 lg:pt-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
            Gestionare Meniu
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {items.length} produse • {statusCounts.disponibil ?? 0} disponibile
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={quickEditMode ? tryExitQuickEdit : enterQuickEdit}
            className={`gap-2 text-sm ${
              quickEditMode
                ? 'border-primary/50 text-primary bg-primary/10 hover:bg-primary/20'
                : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20'
            }`}
          >
            <Zap className="h-4 w-4" />
            {quickEditMode ? 'Ieși din edit rapid' : 'Edit rapid'}
          </Button>
          <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            <Plus className="h-4 w-4" />
            Adaugă produs
          </Button>
        </div>
      </div>

      {/* Filter row: category tabs + divider + status tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {[
          { value: 'all', label: 'Toate' },
          { value: 'food', label: 'Mâncare' },
          { value: 'drinks', label: 'Băuturi' },
          { value: 'desserts', label: 'Deserturi' },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilterCategory(tab.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filterCategory === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:border-primary/40'
            }`}
          >
            {tab.label}
          </button>
        ))}

        <div className="w-px h-5 bg-white/10 mx-1 hidden sm:block" />

        {STATUS_ORDER.map(value => {
          const cfg = STATUS_CONFIG[value];
          const count = statusCounts[value] ?? 0;
          const active = filterStatus === value;
          return (
            <button
              key={value}
              onClick={() => setFilterStatus(active ? 'all' : value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                active
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:border-primary/40'
              }`}
            >
              <span>{cfg.icon}</span>
              {cfg.label}
              <span className={`text-[10px] rounded-full px-1.5 leading-4 ${
                active ? 'bg-primary/30 text-primary' : 'bg-white/10 text-gray-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Caută după nume, ingrediente, categorie..."
            className="w-full bg-[#1A1A1A] border border-[#2E2E2E] focus:border-primary rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-xs text-gray-400 mt-1.5 ml-1">
            {filtered.length} {filtered.length === 1 ? 'produs găsit' : 'produse găsite'}
          </p>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Produs</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Categorie</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Subcategorie</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Preț</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-center px-2 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">⭐</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    {searchQuery
                      ? `Niciun produs găsit pentru „${searchQuery}".`
                      : 'Niciun produs în această categorie.'}
                  </td>
                </tr>
              )}
              {filtered.map(item => {
                const itemStatus = getItemStatus(item);
                const statusCfg = STATUS_CONFIG[itemStatus];
                const isDirty = rowHasChanges(item);
                const inlineEdit = inlineEdits[item.id];
                const isSavingRow = savingRows[item.id] ?? false;

                return (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-50 dark:border-white/5 last:border-0 transition-colors ${
                      isDirty
                        ? 'bg-primary/5'
                        : 'hover:bg-gray-50/50 dark:hover:bg-white/[0.025]'
                    }`}
                    style={isDirty ? { boxShadow: 'inset 3px 0 0 var(--color-primary)' } : undefined}
                  >
                    {/* Produs */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-white/10 shrink-0">
                          {item.image && (
                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                          )}
                        </div>
                        {quickEditMode ? (
                          <input
                            type="text"
                            value={inlineEdit?.name ?? item.name}
                            onChange={e => updateInlineField(item.id, 'name', e.target.value)}
                            className="flex-1 min-w-0 bg-[#0F0F0F] border border-[#2E2E2E] focus:border-primary rounded-lg px-2 py-1 text-sm text-white outline-none"
                          />
                        ) : (
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 dark:text-white truncate max-w-[200px]">{item.name}</p>
                            <p className="text-xs text-gray-400 line-clamp-1 max-w-[220px]">{item.description}</p>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Categorie */}
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs">
                        {CATEGORY_LABELS[item.category] ?? item.category}
                      </Badge>
                    </td>

                    {/* Subcategorie */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {item.subcategory ? (SUBCATEGORY_LABELS[item.subcategory] ?? item.subcategory) : '—'}
                      </span>
                    </td>

                    {/* Preț */}
                    <td className="px-4 py-3">
                      {quickEditMode ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            value={inlineEdit?.price ?? item.price}
                            onChange={e => updateInlineField(item.id, 'price', parseFloat(e.target.value) || 0)}
                            className="w-14 bg-[#0F0F0F] border border-[#2E2E2E] focus:border-primary rounded-lg px-2 py-1 text-sm text-primary outline-none"
                          />
                          <span className="text-gray-600 text-xs">/</span>
                          <input
                            type="text"
                            value={inlineEdit?.unit ?? item.unit}
                            onChange={e => updateInlineField(item.id, 'unit', e.target.value)}
                            className="w-14 bg-[#0F0F0F] border border-[#2E2E2E] focus:border-primary rounded-lg px-2 py-1 text-xs text-gray-400 outline-none"
                          />
                        </div>
                      ) : (
                        <span className="font-semibold text-primary whitespace-nowrap">
                          {item.price} RON{item.unit ? ` / ${item.unit}` : ''}
                        </span>
                      )}
                    </td>

                    {/* Status dropdown badge */}
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 cursor-pointer whitespace-nowrap ${statusCfg.className}`}>
                            <span>{statusCfg.icon}</span>
                            <span>{statusCfg.label}</span>
                            <ChevronDown className="h-2.5 w-2.5 ml-0.5 opacity-60" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-44 bg-[#1a1a1a] border-white/10">
                          {STATUS_ORDER.map(value => {
                            const cfg = STATUS_CONFIG[value];
                            return (
                              <DropdownMenuItem
                                key={value}
                                onClick={() => handleStatusChange(item.id, value)}
                                className={`flex items-center gap-2 cursor-pointer text-sm ${
                                  itemStatus === value ? 'bg-white/5' : ''
                                }`}
                              >
                                <span>{cfg.icon}</span>
                                <span>{cfg.label}</span>
                                {itemStatus === value && <span className="ml-auto text-primary text-xs">✓</span>}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>

                    {/* Popular star */}
                    <td className="px-2 py-3 text-center">
                      <button
                        onClick={() => togglePopular(item)}
                        title={item.popular ? 'Elimină din populare' : 'Marchează ca popular'}
                        className={`transition-colors ${
                          item.popular ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-600 hover:text-yellow-400'
                        }`}
                      >
                        <Star className={`h-4 w-4 ${item.popular ? 'fill-yellow-400' : ''}`} />
                      </button>
                    </td>

                    {/* Acțiuni */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {quickEditMode ? (
                          <>
                            {isDirty && (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                  onClick={() => saveInlineRow(item)}
                                  disabled={isSavingRow}
                                  title="Salvează"
                                >
                                  {isSavingRow ? (
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-green-400/30 border-t-green-400 inline-block" />
                                  ) : (
                                    <Save className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-gray-400 hover:text-white"
                                  onClick={() => cancelInlineRow(item)}
                                  title="Anulează modificările"
                                >
                                  <Undo2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-gray-400 hover:text-primary"
                              onClick={() => openEdit(item)}
                              title="Editează complet"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {role === 'admin' && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-gray-400 hover:text-destructive"
                                onClick={() => setDeleteId(item.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </>
                        ) : (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-gray-400 hover:text-primary"
                              onClick={() => openEdit(item)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {role === 'admin' && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-gray-400 hover:text-destructive"
                                onClick={() => setDeleteId(item.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Editează produs' : 'Adaugă produs nou'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nume produs *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="ex: Ciorbă de burtă"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Descriere</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descriere scurtă a produsului"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Preț (RON) *</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.price || ''}
                  onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Unitate</Label>
                <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categorie *</Label>
                <Select
                  value={form.category}
                  onValueChange={v => {
                    const cat = v as MenuProduct['category'];
                    setForm(f => ({ ...f, category: cat, subcategory: SUBCATEGORY_MAP[cat][0].value }));
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">Mâncare</SelectItem>
                    <SelectItem value="drinks">Băuturi</SelectItem>
                    <SelectItem value="desserts">Deserturi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Subcategorie *</Label>
                <Select value={form.subcategory} onValueChange={v => setForm(f => ({ ...f, subcategory: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(SUBCATEGORY_MAP[form.category] ?? []).map(sub => (
                      <SelectItem key={sub.value} value={sub.value}>{sub.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <ImagePickerField
              label="Imagine"
              value={form.image}
              onChange={url => setForm(f => ({ ...f, image: url }))}
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status ?? 'disponibil'}
                  onValueChange={v => {
                    const s = v as MenuStatus;
                    setForm(f => ({ ...f, status: s, available: s === 'disponibil' }));
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_ORDER.map(value => (
                      <SelectItem key={value} value={value}>
                        {STATUS_CONFIG[value].icon} {STATUS_CONFIG[value].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>&nbsp;</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    checked={form.popular}
                    onCheckedChange={v => setForm(f => ({ ...f, popular: v }))}
                  />
                  <Label className="cursor-pointer">Popular ⭐</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Anulează
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {saving ? 'Se salvează...' : editItem ? 'Salvează modificările' : 'Adaugă produs'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ești sigur?</AlertDialogTitle>
            <AlertDialogDescription>
              Produsul va fi șters definitiv și nu va mai apărea pe site.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Exit quick-edit confirm */}
      <AlertDialog open={exitEditConfirm} onOpenChange={setExitEditConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Modificări nesalvate</AlertDialogTitle>
            <AlertDialogDescription>
              Ai rânduri cu modificări nesalvate. Dacă ieși din modul „Edit rapid", toate modificările vor fi anulate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Rămâi în editare</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmExitQuickEdit}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ieși fără să salvezi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
