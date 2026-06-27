'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Upload, Copy, Trash2, Check, Images } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getUploadedImages, uploadImage, deleteImage } from '@/lib/actions/upload';

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export function MediaPickerModal({ open, onClose, onSelect }: MediaPickerModalProps) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open) loadImages();
  }, [open]);

  async function loadImages() {
    setLoading(true);
    const imgs = await getUploadedImages();
    setImages(imgs);
    setLoading(false);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const result = await uploadImage(fd);
    setUploading(false);
    if ('error' in result) {
      toast.error(result.error);
    } else {
      setImages((prev) => [result.url, ...prev]);
      toast.success('Imagine încărcată!');
    }
    e.target.value = '';
  }

  async function handleDelete(url: string) {
    const result = await deleteImage(url);
    if (result.success) {
      setImages((prev) => prev.filter((u) => u !== url));
      toast.success('Imagine ștearsă.');
    } else {
      toast.error(result.error ?? 'Eroare la ștergere.');
    }
    setDeleteTarget(null);
  }

  function handleCopy(url: string) {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
    toast.success('URL copiat!');
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Images className="h-5 w-5 text-primary" />
              Bibliotecă imagini
            </DialogTitle>
          </DialogHeader>

          <div className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl p-4 flex items-center justify-center gap-3 shrink-0">
            <Upload className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">Trage o imagine sau</span>
            <label className="cursor-pointer">
              <span className="text-sm font-medium text-primary hover:underline">
                {uploading ? 'Se încarcă...' : 'alege un fișier'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                Se încarcă imaginile...
              </div>
            ) : images.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Images className="h-10 w-10 mb-3 text-gray-200 dark:text-gray-700" />
                <p className="text-sm">Nicio imagine încărcată încă.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-1">
                {images.map((url) => (
                  <div
                    key={url}
                    className="group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary/60 cursor-pointer transition-all bg-gray-100 dark:bg-white/5"
                    onClick={() => onSelect(url)}
                  >
                    <Image src={url} alt="" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 bg-white/20 text-white hover:bg-white/30"
                        onClick={(e) => { e.stopPropagation(); handleCopy(url); }}
                      >
                        {copiedUrl === url ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 bg-white/20 text-white hover:bg-red-500/80"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(url); }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ștergi imaginea?</AlertDialogTitle>
            <AlertDialogDescription>
              Imaginea va fi ștearsă definitiv. Dacă este folosită undeva pe site, nu va mai fi afișată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
