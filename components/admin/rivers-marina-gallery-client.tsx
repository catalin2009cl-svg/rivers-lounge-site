'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Trash2, GripVertical, Upload, Loader2, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { toast } from 'sonner';
import {
  uploadRiversMarinaPhoto,
  deleteRiversMarinaPhoto,
  reorderRiversMarinaPhotos,
} from '@/lib/actions/gallery';
import type { RiversMarinaPhoto } from '@/lib/server-data';

const MAX_PHOTOS = 8;

async function compressImage(file: File, maxWidth = 1920, quality = 0.85): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

interface Props {
  initialPhotos: RiversMarinaPhoto[];
}

export function RiversMarinaGalleryClient({ initialPhotos }: Props) {
  const [photos, setPhotos] = useState<RiversMarinaPhoto[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const draggedIdx = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const atLimit = photos.length >= MAX_PHOTOS;

  async function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!arr.length) return;
    if (photos.length + arr.length > MAX_PHOTOS) {
      setUploadError(`Poți adăuga maxim ${MAX_PHOTOS} fotografii. Mai ai loc pentru ${MAX_PHOTOS - photos.length}.`);
      return;
    }
    setUploadError(null);
    setUploading(true);

    for (const raw of arr) {
      if (photos.length >= MAX_PHOTOS) break;
      const file = await compressImage(raw);
      const fd = new FormData();
      fd.append('file', file);
      const result = await uploadRiversMarinaPhoto(fd);
      if ('error' in result) {
        setUploadError(result.error);
      } else {
        setPhotos((prev) => [...prev, result.photo]);
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteRiversMarinaPhoto(id);
    if (result.success) {
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      toast.success('Fotografie ștearsă.');
    } else {
      toast.error(result.error ?? 'Eroare la ștergere.');
    }
    setDeletingId(null);
  }

  function onDragStart(idx: number) { draggedIdx.current = idx; }
  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (draggedIdx.current === null || draggedIdx.current === idx) return;
    const next = [...photos];
    const [moved] = next.splice(draggedIdx.current, 1);
    next.splice(idx, 0, moved);
    draggedIdx.current = idx;
    setPhotos(next.map((p, i) => ({ ...p, order: i + 1 })));
  }
  async function onDragEnd() {
    draggedIdx.current = null;
    await reorderRiversMarinaPhotos(photos.map((p) => ({ id: p.id, order: p.order })));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {photos.length} / {MAX_PHOTOS} fotografii
          </p>
        </div>
        {atLimit && (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-medium">
            <AlertTriangle className="h-4 w-4" />
            Limita de {MAX_PHOTOS} fotografii atinsă
          </div>
        )}
      </div>

      {!atLimit && (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-gray-200 dark:border-white/10 hover:border-primary/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          style={{ cursor: 'pointer' }}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Se încarcă fotografiile...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <Upload className="h-8 w-8 opacity-50" />
              <p className="text-sm font-medium">Trage fotografii sau click pentru selecție</p>
              <p className="text-xs opacity-60">
                JPG, PNG, WebP • Max 10 MB • {MAX_PHOTOS - photos.length} locuri disponibile
              </p>
            </div>
          )}
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-4 py-3">
          <X className="h-4 w-4 shrink-0" />
          <span className="flex-1">{uploadError}</span>
          <button onClick={() => setUploadError(null)}>
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {photos.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          Nicio fotografie adăugată. Galeria River&apos;s Marina va afișa un placeholder până atunci.
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">
            Trage rândurile pentru reordonare ({photos.length} {photos.length === 1 ? 'fotografie' : 'fotografii'} • max {MAX_PHOTOS})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, idx) => (
              <div
                key={photo.id}
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragOver={(e) => onDragOver(e, idx)}
                onDragEnd={onDragEnd}
                className="group relative rounded-xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#1a1a1a] overflow-hidden"
                style={{ cursor: 'grab' }}
              >
                <div className="relative h-36">
                  <Image
                    src={photo.src}
                    alt={`Fotografie ${idx + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute top-2 left-2 bg-black/50 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>
                  <div className="absolute top-2 right-2 bg-black/55 text-white text-[10px] font-mono rounded px-1.5 py-0.5">
                    #{idx + 1}
                  </div>
                </div>
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span className="text-[10px] text-gray-400 truncate flex-1">
                    {photo.src.split('/').pop()}
                  </span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                        disabled={deletingId === photo.id}
                      >
                        {deletingId === photo.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Ștergi fotografia?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Fotografia va fi eliminată definitiv din galeria River&apos;s Marina.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Anulează</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDelete(photo.id)}
                        >
                          Șterge
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
