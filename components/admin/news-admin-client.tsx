'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2, Newspaper, CalendarDays, Link2, Check } from 'lucide-react';
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
import type { NewsPost } from '@/lib/server-data';
import type { AdminRole } from '@/lib/auth';
import { createNewsPost, updateNewsPost, deleteNewsPost } from '@/lib/actions/news';
import { ImagePickerField } from './image-picker-field';

const CATEGORY_LABELS: Record<string, string> = {
  events: 'Eveniment',
  'daily-menu': 'Meniul Zilei',
  promotions: 'Promoție',
};

const STATUS_LABELS: Record<string, string> = {
  published: 'Publicat',
  draft: 'Draft',
  scheduled: 'Programat',
};

const EMPTY_FORM: Omit<NewsPost, 'id' | 'slug'> = {
  title: '',
  date: new Date().toISOString().slice(0, 10),
  image: '',
  excerpt: '',
  content: '',
  category: 'events',
  status: 'draft',
};

interface NewsAdminClientProps {
  initialPosts: NewsPost[];
  role?: AdminRole;
}

export function NewsAdminClient({ initialPosts, role = 'admin' }: NewsAdminClientProps) {
  const [posts, setPosts] = useState<NewsPost[]>(initialPosts);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editPost, setEditPost] = useState<NewsPost | null>(null);
  const [form, setForm] = useState<Omit<NewsPost, 'id' | 'slug'>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function openCreate() {
    setEditPost(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(post: NewsPost) {
    setEditPost(post);
    setForm({
      title: post.title,
      date: post.date,
      image: post.image,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      status: post.status,
      publishAt: post.publishAt,
    });
    setDialogOpen(true);
  }

  function copyLink(post: NewsPost) {
    const url = `${window.location.origin}/noutati/${post.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Link copiat!');
  }

  async function handleSave() {
    if (!form.title.trim()) return toast.error('Titlul este obligatoriu.');
    setSaving(true);
    try {
      if (editPost) {
        const result = await updateNewsPost(editPost.id, form);
        if (!result.success) throw new Error(result.error);
        setPosts((prev) => prev.map((p) => (p.id === editPost.id ? result.data! : p)));
        toast.success('Articol actualizat!');
      } else {
        const result = await createNewsPost(form);
        if (!result.success) throw new Error(result.error);
        setPosts((prev) => [result.data!, ...prev]);
        toast.success('Articol publicat!');
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
    const result = await deleteNewsPost(deleteId);
    if (result.success) {
      setPosts((prev) => prev.filter((p) => p.id !== deleteId));
      toast.success('Articol șters.');
    } else {
      toast.error(result.error ?? 'Eroare la ștergere.');
    }
    setDeleteId(null);
  }

  const filtered = filterStatus === 'all' ? posts : posts.filter((p) => p.status === filterStatus);
  const sortedFiltered = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  function statusBadgeClass(status: string) {
    if (status === 'published') return 'bg-green-500/10 text-green-600 dark:text-green-400';
    if (status === 'scheduled') return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    return 'bg-gray-100 dark:bg-white/5 text-gray-500';
  }

  function categoryBadgeClass(cat: string) {
    if (cat === 'events') return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    if (cat === 'daily-menu') return 'bg-green-500/10 text-green-600 dark:text-green-400';
    return 'bg-primary/10 text-primary';
  }

  return (
    <div className="p-6 lg:p-8 pt-20 lg:pt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-primary" />
            Noutăți & Evenimente
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {posts.filter((p) => p.status === 'published').length} publicate •{' '}
            {posts.filter((p) => p.status === 'draft').length} draft-uri
          </p>
        </div>
        <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Articol nou
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { value: 'all', label: 'Toate' },
          { value: 'published', label: 'Publicate' },
          { value: 'draft', label: 'Draft-uri' },
          { value: 'scheduled', label: 'Programate' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filterStatus === tab.value
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Articol</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Categorie</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Data</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {sortedFiltered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    Niciun articol găsit.
                  </td>
                </tr>
              )}
              {sortedFiltered.map((post) => (
                <tr key={post.id} className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/2.5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-white/10 shrink-0">
                        {post.image && (
                          <Image src={post.image} alt={post.title} fill className="object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">{post.title}</p>
                        <p className="text-xs text-gray-400 line-clamp-1 max-w-xs">{post.excerpt}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${categoryBadgeClass(post.category)}`}>
                      {CATEGORY_LABELS[post.category] ?? post.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {new Date(post.date).toLocaleDateString('ro-RO')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadgeClass(post.status)}`}>
                      {STATUS_LABELS[post.status] ?? post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-gray-400 hover:text-primary"
                        onClick={() => copyLink(post)}
                        title="Copiază link"
                      >
                        {copiedId === post.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Link2 className="h-3.5 w-3.5" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-primary" onClick={() => openEdit(post)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {role === 'admin' && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-destructive" onClick={() => setDeleteId(post.id)}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editPost ? 'Editează articol' : 'Articol nou'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Titlu *</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Titlul articolului" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Data publicării *</Label>
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
                <Label>Categorie</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as NewsPost['category'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="events">Eveniment</SelectItem>
                    <SelectItem value="daily-menu">Meniul Zilei</SelectItem>
                    <SelectItem value="promotions">Promoție</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as NewsPost['status'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Publicat</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Programat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.status === 'scheduled' && (
                <div className="space-y-1.5">
                  <Label>Publică la data</Label>
                  <div className="relative">
                    <Input
                      type="datetime-local"
                      value={form.publishAt ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, publishAt: e.target.value }))}
                      className="pr-10"
                    />
                    <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>

            <ImagePickerField
              label="Imagine copertă"
              value={form.image}
              onChange={(url) => setForm((f) => ({ ...f, image: url }))}
            />

            <div className="space-y-1.5">
              <Label>Rezumat (excerpt) *</Label>
              <Textarea value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} placeholder="Scurtă descriere vizibilă în listare" rows={2} />
            </div>

            <div className="space-y-1.5">
              <Label>Conținut complet</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Conținutul complet al articolului (separă paragrafele cu o linie goală)"
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-400">Separă paragrafele cu o linie goală.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Anulează
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {saving ? 'Se salvează...' : editPost ? 'Salvează modificările' : 'Publică articolul'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ștergi articolul?</AlertDialogTitle>
            <AlertDialogDescription>
              Articolul va fi șters definitiv și nu va mai apărea pe site sau în listare.
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
