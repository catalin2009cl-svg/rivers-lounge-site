'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2, CalendarDays, Calendar, Clock, MapPin, Link2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { SpecialEvent } from '@/lib/server-data';
import type { AdminRole } from '@/lib/auth';
import { createSpecialEvent, updateSpecialEvent, deleteSpecialEvent } from '@/lib/actions/events';
import { ImagePickerField } from './image-picker-field';

const LOCATION_BADGE: Record<SpecialEvent['location'], string> = {
  'Restaurant':      'bg-blue-500/15 text-blue-400',
  'Cabana Rivers':   'bg-green-500/15 text-green-400',
  "River's Land":    'bg-purple-500/15 text-purple-400',
  "River's Marina":  'bg-teal-500/15 text-teal-400',
  'Toate locațiile': 'bg-primary/10 text-primary',
};

const EMPTY_FORM: Omit<SpecialEvent, 'id'> = {
  title: '',
  date: new Date().toISOString().slice(0, 10),
  time: '20:00',
  description: '',
  image: '',
  ctaLabel: 'Rezervă locul',
  ctaUrl: '/rezervari',
  location: 'Cabana Rivers',
};

interface EventsAdminClientProps {
  initialEvents: SpecialEvent[];
  role?: AdminRole;
}

export function EventsAdminClient({ initialEvents, role = 'admin' }: EventsAdminClientProps) {
  const [events, setEvents] = useState<SpecialEvent[]>(initialEvents);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editEvent, setEditEvent] = useState<SpecialEvent | null>(null);
  const [form, setForm] = useState<Omit<SpecialEvent, 'id'>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterLocation, setFilterLocation] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.date) >= now);
  const past = events.filter((e) => new Date(e.date) < now);

  function openCreate() {
    setEditEvent(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(event: SpecialEvent) {
    setEditEvent(event);
    setForm({
      title: event.title,
      date: event.date,
      time: event.time,
      description: event.description,
      image: event.image,
      ctaLabel: event.ctaLabel,
      ctaUrl: event.ctaUrl,
      location: event.location,
    });
    setDialogOpen(true);
  }

  function copyLink(event: SpecialEvent) {
    const url = `${window.location.origin}/evenimente/${event.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(event.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Link copiat!');
  }

  async function handleSave() {
    if (!form.title.trim()) return toast.error('Titlul evenimentului este obligatoriu.');
    if (!form.date) return toast.error('Data evenimentului este obligatorie.');
    setSaving(true);
    try {
      if (editEvent) {
        const result = await updateSpecialEvent(editEvent.id, form);
        if (!result.success) throw new Error(result.error);
        setEvents((prev) => prev.map((e) => (e.id === editEvent.id ? result.data! : e)));
        toast.success('Eveniment actualizat!');
      } else {
        const result = await createSpecialEvent(form);
        if (!result.success) throw new Error(result.error);
        setEvents((prev) => [...prev, result.data!]);
        toast.success('Eveniment adăugat!');
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
    const result = await deleteSpecialEvent(deleteId);
    if (result.success) {
      setEvents((prev) => prev.filter((e) => e.id !== deleteId));
      toast.success('Eveniment șters.');
    } else {
      toast.error(result.error ?? 'Eroare la ștergere.');
    }
    setDeleteId(null);
  }

  const sortedEvents = [...events]
    .filter((e) => filterLocation === 'all' || e.location === filterLocation)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  function isUpcoming(date: string) {
    return new Date(date) >= new Date();
  }

  return (
    <div className="p-6 lg:p-8 pt-20 lg:pt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            Evenimente Speciale
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {upcoming.length} viitoare • {past.length} trecute
          </p>
        </div>
        <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Eveniment nou
        </Button>
      </div>

      {/* Info box */}
      <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-gray-600 dark:text-gray-400">
        Evenimentele viitoare apar pe pagina principală și pe paginile locației respective (<strong>/cabana</strong>, <strong>/rivers-land</strong>, <strong>/rivers-marina</strong>). "Toate locațiile" apare pe toate paginile.
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { value: 'all',              label: 'Toate' },
          { value: 'Restaurant',       label: 'Restaurant' },
          { value: 'Cabana Rivers',    label: 'Cabana Rivers' },
          { value: "River's Land",     label: "River's Land" },
          { value: "River's Marina",   label: "River's Marina" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterLocation(tab.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filterLocation === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:border-primary/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Eveniment</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Data & Ora</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Locație</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {sortedEvents.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-gray-400">
                    <CalendarDays className="h-10 w-10 mx-auto mb-3 text-gray-200 dark:text-gray-700" />
                    <p>Niciun eveniment adăugat.</p>
                    <button onClick={openCreate} className="text-primary text-sm hover:underline mt-1 block mx-auto">
                      Adaugă primul eveniment →
                    </button>
                  </td>
                </tr>
              )}
              {sortedEvents.map((event) => (
                <tr key={event.id} className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/2.5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-white/10 shrink-0">
                        {event.image && (
                          <Image src={event.image} alt={event.title} fill className="object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">{event.title}</p>
                        <p className="text-xs text-gray-400 line-clamp-1 max-w-xs">{event.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    <div>
                      <span className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {new Date(event.date).toLocaleDateString('ro-RO')}
                      </span>
                      {event.time && (
                        <span className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {event.time}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${LOCATION_BADGE[event.location] ?? LOCATION_BADGE['Toate locațiile']}`}>
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isUpcoming(event.date)
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                    }`}>
                      {isUpcoming(event.date) ? 'Viitor' : 'Trecut'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-gray-400 hover:text-primary"
                        onClick={() => copyLink(event)}
                        title="Copiază link"
                      >
                        {copiedId === event.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Link2 className="h-3.5 w-3.5" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-primary" onClick={() => openEdit(event)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {role === 'admin' && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-destructive" onClick={() => setDeleteId(event.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editEvent ? 'Editează eveniment' : 'Eveniment nou'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Titlu eveniment *</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="ex: Seară de Salsa & Cocktails" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Data *</Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="pr-10"
                  />
                  <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Ora</Label>
                <div className="relative">
                  <Input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                    className="pr-10"
                  />
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Locație *</Label>
              <Select value={form.location} onValueChange={(v) => setForm((f) => ({ ...f, location: v as SpecialEvent['location'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Restaurant">Restaurant</SelectItem>
                  <SelectItem value="Cabana Rivers">Cabana Rivers</SelectItem>
                  <SelectItem value="River's Land">River's Land</SelectItem>
                  <SelectItem value="River's Marina">River's Marina</SelectItem>
                  <SelectItem value="Toate locațiile">Toate locațiile</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Descriere</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Descrierea evenimentului" rows={3} />
            </div>

            <ImagePickerField
              label="Imagine copertă"
              value={form.image}
              onChange={(url) => setForm((f) => ({ ...f, image: url }))}
            />

            {/* CTA */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Text buton CTA</Label>
                <Input value={form.ctaLabel} onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))} placeholder="ex: Rezervă locul" />
              </div>
              <div className="space-y-1.5">
                <Label>URL buton CTA</Label>
                <Input value={form.ctaUrl} onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value }))} placeholder="/rezervari" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Anulează
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {saving ? 'Se salvează...' : editEvent ? 'Salvează modificările' : 'Adaugă eveniment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ștergi evenimentul?</AlertDialogTitle>
            <AlertDialogDescription>
              Evenimentul va fi șters definitiv și nu va mai apărea pe site.
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
    </div>
  );
}
