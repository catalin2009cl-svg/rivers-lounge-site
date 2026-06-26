'use client';

import { useState } from 'react';
import { Star, Trash2, Plus, Save, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { addReview, updateReview, deleteReview } from '@/lib/actions/reviews';
import type { Review } from '@/lib/server-data';

interface Props {
  initialReviews: Review[];
  canDelete: boolean;
}

const EMPTY_FORM: Omit<Review, 'id'> = {
  name: '',
  rating: 5,
  text: '',
  date: '',
  source: 'manual',
  approved: true,
  featured: true,
};

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="focus:outline-none"
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              n <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewsAdminClient({ initialReviews, canDelete }: Props) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<Omit<Review, 'id'>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd() {
    if (!form.name.trim() || !form.text.trim() || !form.date.trim()) {
      toast.error('Completează toate câmpurile obligatorii.');
      return;
    }
    setSaving(true);
    const result = await addReview(form);
    setSaving(false);
    if (result.success && result.review) {
      setReviews((r) => [...r, result.review!]);
      setForm(EMPTY_FORM);
      setShowAddForm(false);
      toast.success('Recenzie adăugată!');
    } else {
      toast.error(result.error ?? 'Eroare la adăugare.');
    }
  }

  async function handleToggle(review: Review, field: 'approved' | 'featured') {
    setTogglingId(`${review.id}-${field}`);
    const updates = { [field]: !review[field] };
    const result = await updateReview(review.id, updates);
    setTogglingId(null);
    if (result.success) {
      setReviews((rs) =>
        rs.map((r) => (r.id === review.id ? { ...r, ...updates } : r))
      );
    } else {
      toast.error(result.error ?? 'Eroare.');
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteReview(id);
    setDeletingId(null);
    if (result.success) {
      setReviews((rs) => rs.filter((r) => r.id !== id));
      toast.success('Recenzie ștearsă.');
    } else {
      toast.error(result.error ?? 'Eroare la ștergere.');
    }
  }

  const featured = reviews.filter((r) => r.approved && r.featured).length;

  return (
    <div className="p-6 lg:p-8 pt-20 lg:pt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Star className="h-6 w-6 text-primary" />
            Recenzii
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {featured} recenzii afișate pe homepage · {reviews.length} total
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm((v) => !v)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
        >
          <Plus className="h-4 w-4" />
          Adaugă recenzie
        </Button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/10 p-6 mb-6">
          <h2 className="font-semibold text-gray-800 dark:text-white mb-4">Recenzie nouă</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nume client *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ion Popescu"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Dată afișată *</Label>
              <Input
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                placeholder="ianuarie 2024"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Text recenzie *</Label>
              <Textarea
                value={form.text}
                onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                placeholder="Experiența clientului..."
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rating</Label>
              <StarRating value={form.rating} onChange={(n) => setForm((f) => ({ ...f, rating: n }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Sursă</Label>
              <select
                value={form.source}
                onChange={(e) => setForm((f) => ({ ...f, source: e.target.value as Review['source'] }))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="google">Google</option>
                <option value="manual">Manual</option>
                <option value="other">Altă sursă</option>
              </select>
            </div>
            <div className="flex items-center gap-6 sm:col-span-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.approved}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, approved: v }))}
                />
                <Label>Aprobat</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.featured}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, featured: v }))}
                />
                <Label>Afișat pe homepage</Label>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAdd} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Se salvează...' : 'Salvează recenzie'}
            </Button>
            <Button variant="outline" onClick={() => { setShowAddForm(false); setForm(EMPTY_FORM); }}>
              Anulează
            </Button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Star className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Nicio recenzie adăugată.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-white/10 p-4 flex gap-4 items-start"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                {review.name.charAt(0)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">
                    {review.name}
                  </span>
                  <span className="text-xs text-gray-400">{review.date}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full uppercase ${
                    review.source === 'google'
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'bg-gray-500/10 text-gray-400'
                  }`}>
                    {review.source}
                  </span>
                </div>

                <div className="flex gap-0.5 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{review.text}</p>
              </div>

              {/* Controls */}
              <div className="flex flex-col gap-2 shrink-0 items-end">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggle(review, 'approved')}
                    disabled={togglingId === `${review.id}-approved`}
                    title={review.approved ? 'Aprobat — click dezactivare' : 'Neaprobat — click aprobare'}
                    className="text-xs flex items-center gap-1 transition-colors"
                  >
                    {review.approved
                      ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                      : <XCircle className="h-4 w-4 text-gray-500" />
                    }
                    <span className={review.approved ? 'text-green-500' : 'text-gray-400'}>
                      {review.approved ? 'Aprobat' : 'Neaprobat'}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400">Homepage</span>
                  <Switch
                    checked={review.featured}
                    onCheckedChange={() => handleToggle(review, 'featured')}
                    disabled={togglingId === `${review.id}-featured`}
                  />
                </div>

                {canDelete && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-gray-400 hover:text-destructive"
                    disabled={deletingId === review.id}
                    onClick={() => handleDelete(review.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="mt-6 text-sm text-gray-400 bg-gray-50 dark:bg-white/5 rounded-xl p-4">
        Pe homepage apar doar recenziile marcate ca <strong className="text-gray-300">Aprobat</strong> și <strong className="text-gray-300">Afișat pe homepage</strong>.
        Poți dezactiva o recenzie fără să o ștergi folosind toggle-ul &quot;Aprobat&quot;.
      </div>
    </div>
  );
}
