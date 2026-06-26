'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Trash2, GripVertical, Upload, Loader2, X } from 'lucide-react';
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
import {
  uploadCabanaPhoto,
  deleteCabanaPhoto,
  reorderCabanaPhotos,
} from '@/lib/actions/gallery';
import type { CabanaPhoto } from '@/lib/server-data';

interface Props {
  initialPhotos: CabanaPhoto[];
}

async function compressImage(file: File, maxWidth = 1920, quality = 0.82): Promise<File> {
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

export function CabanaGalleryClient({ initialPhotos }: Props) {
  const [photos, setPhotos] = useState<CabanaPhoto[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Drag-to-reorder state
  const draggedIdx = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!arr.length) return;
    setUploadError(null);
    setUploading(true);

    for (const raw of arr) {
      const file = await compressImage(raw);
      const fd = new FormData();
      fd.append('file', file);
      const result = await uploadCabanaPhoto(fd);
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
    const result = await deleteCabanaPhoto(id);
    if (result.success) {
      setPhotos((prev) => prev.filter((p) => p.id !== id));
    } else {
      alert(result.error ?? 'Eroare la ștergere.');
    }
    setDeletingId(null);
  }

  // Drag-reorder helpers
  function onDragStart(idx: number) {
    draggedIdx.current = idx;
  }
  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (draggedIdx.current === null || draggedIdx.current === idx) return;
    const next = [...photos];
    const [moved] = next.splice(draggedIdx.current, 1);
    next.splice(idx, 0, moved);
    draggedIdx.current = idx;
    const reindexed = next.map((p, i) => ({ ...p, order: i + 1 }));
    setPhotos(reindexed);
  }
  async function onDragEnd() {
    draggedIdx.current = null;
    await reorderCabanaPhotos(photos.map((p) => ({ id: p.id, order: p.order })));
  }

  // Drop zone
  function onDropZoneDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-8">
      {/* Upload zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDropZoneDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{ cursor: 'pointer' }}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Se încarcă fotografiile...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="h-8 w-8 opacity-50" />
            <p className="text-sm font-medium">Trage fotografii aici sau click pentru selecție</p>
            <p className="text-xs opacity-60">JPG, PNG, WebP • Max 10 MB per imagine</p>
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

      {uploadError && (
        <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
          <X className="h-4 w-4 shrink-0" />
          {uploadError}
          <button className="ml-auto" onClick={() => setUploadError(null)}>
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Photo grid */}
      {photos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Nicio fotografie adăugată. Încarcă prima imagine de mai sus.
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Trage rândurile pentru a reordona fotografiile ({photos.length} {photos.length === 1 ? 'fotografie' : 'fotografii'})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo, idx) => (
              <div
                key={photo.id}
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragOver={(e) => onDragOver(e, idx)}
                onDragEnd={onDragEnd}
                className="group relative rounded-xl border border-border bg-card overflow-hidden"
                style={{ cursor: 'grab' }}
              >
                {/* Thumbnail */}
                <div className="relative h-44">
                  <Image
                    src={photo.src}
                    alt={photo.caption || `Fotografie ${idx + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {/* Drag handle overlay */}
                  <div className="absolute top-2 left-2 bg-black/50 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>
                  {/* Order badge */}
                  <div className="absolute top-2 right-2 bg-black/55 text-white text-xs font-mono rounded px-1.5 py-0.5">
                    #{idx + 1}
                  </div>
                </div>

                {/* Caption + delete */}
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="text-xs text-muted-foreground truncate flex-1">
                    {photo.caption || <span className="italic opacity-50">fără legendă</span>}
                  </span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-destructive hover:bg-destructive/10"
                        disabled={deletingId === photo.id}
                      >
                        {deletingId === photo.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Șterge fotografia?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Fotografia va fi eliminată definitiv din galerie și de pe server. Această acțiune nu poate fi anulată.
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
