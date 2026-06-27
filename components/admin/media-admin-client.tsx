'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Upload, Copy, Trash2, Check, Images } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { uploadImage, deleteImage } from '@/lib/actions/upload';
import { RiversLandGalleryClient } from '@/components/admin/rivers-land-gallery-client';
import { RiversMarinaGalleryClient } from '@/components/admin/rivers-marina-gallery-client';
import { CabanaGalleryClient } from '@/components/admin/cabana-gallery-client';
import type { RiversLandPhoto, RiversMarinaPhoto, CabanaPhoto } from '@/lib/server-data';

type Tab = 'media' | 'cabana' | 'rivers-land' | 'rivers-marina';

interface MediaAdminClientProps {
  initialImages: string[];
  initialCabanaPhotos: CabanaPhoto[];
  initialRiversLandPhotos: RiversLandPhoto[];
  initialRiversMarinaPhotos: RiversMarinaPhoto[];
}

export function MediaAdminClient({ initialImages, initialCabanaPhotos, initialRiversLandPhotos, initialRiversMarinaPhotos }: MediaAdminClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('media');
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      const result = await uploadImage(fd);
      if ('error' in result) {
        toast.error(result.error);
      } else {
        newUrls.push(result.url);
      }
    }
    if (newUrls.length > 0) {
      setImages((prev) => [...newUrls, ...prev]);
      toast.success(`${newUrls.length} imagine(i) încărcată(e)!`);
    }
    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    uploadFiles(e.dataTransfer.files);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const result = await deleteImage(deleteTarget);
    if (result.success) {
      setImages((prev) => prev.filter((u) => u !== deleteTarget));
      toast.success('Imagine ștearsă.');
    } else {
      toast.error(result.error ?? 'Eroare la ștergere.');
    }
    setDeleteTarget(null);
  }

  function handleCopy(url: string) {
    const fullUrl = url.startsWith('http') ? url : window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
    toast.success('URL copiat în clipboard!');
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'media', label: 'Imagini Site' },
    { id: 'cabana', label: 'Cabana Photos' },
    { id: 'rivers-land', label: "River's Land" },
    { id: 'rivers-marina', label: "River's Marina" },
  ];

  return (
    <div className="p-6 lg:p-8 pt-20 lg:pt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Images className="h-6 w-6 text-primary" />
            Bibliotecă Media
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {activeTab === 'media'
              ? `${images.length} imagini în Vercel Blob`
              : activeTab === 'cabana'
              ? 'Fotografii galerie Cabana Rivers'
              : activeTab === 'rivers-land'
              ? "Fotografii galerie River's Land (max 8)"
              : "Fotografii galerie River's Marina (max 8)"}
          </p>
        </div>
        {activeTab === 'media' && (
          <label>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => uploadFiles(e.target.files)}
              disabled={uploading}
            />
            <span
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                uploading
                  ? 'bg-primary/60 text-primary-foreground'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Se încarcă...' : 'Încarcă imagini'}
            </span>
          </label>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 dark:bg-white/5 rounded-xl p-1 mb-6 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.id
                ? 'bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Imagini Site */}
      {activeTab === 'media' && (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`rounded-2xl border-2 border-dashed mb-6 p-8 text-center transition-all ${
              isDragging ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-white/10'
            }`}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500">
              {isDragging ? 'Eliberează pentru a încărca' : 'Trage și eliberează imagini aici'}
            </p>
          </div>

          {images.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Images className="h-12 w-12 mx-auto mb-3 text-gray-200 dark:text-gray-700" />
              <p>Nicio imagine încărcată.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {images.map((url) => (
                <div key={url} className="group relative">
                  <div className="aspect-square rounded-xl overflow-hidden border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                    <Image src={url} alt="" fill className="object-cover" />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 rounded-xl transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 bg-white/20 text-white hover:bg-white/40"
                      onClick={() => handleCopy(url)}
                      title="Copiază URL"
                    >
                      {copiedUrl === url ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 bg-white/20 text-white hover:bg-red-500"
                      onClick={() => setDeleteTarget(url)}
                      title="Șterge"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 truncate px-0.5">
                    {url.split('/').pop()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab: Cabana Photos */}
      {activeTab === 'cabana' && (
        <CabanaGalleryClient initialPhotos={initialCabanaPhotos} />
      )}

      {/* Tab: River's Land */}
      {activeTab === 'rivers-land' && (
        <RiversLandGalleryClient initialPhotos={initialRiversLandPhotos} />
      )}

      {/* Tab: River's Marina */}
      {activeTab === 'rivers-marina' && (
        <RiversMarinaGalleryClient initialPhotos={initialRiversMarinaPhotos} />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ștergi imaginea?</AlertDialogTitle>
            <AlertDialogDescription>
              Imaginea va fi ștearsă definitiv din server. Dacă este folosită undeva pe site, nu va mai fi afișată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
