'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, Images, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { uploadImage } from '@/lib/actions/upload';
import { MediaPickerModal } from './media-picker';

interface ImagePickerFieldProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
}

export function ImagePickerField({ label = 'Imagine', value, onChange }: ImagePickerFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
      onChange(result.url);
      toast.success('Imagine încărcată!');
    }
    e.target.value = '';
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="URL imagine sau alege din bibliotecă"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          title="Încarcă de pe calculator"
          className="shrink-0"
        >
          <Upload className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setPickerOpen(true)}
          title="Alege din bibliotecă"
          className="shrink-0"
        >
          <Images className="h-4 w-4" />
        </Button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
      {value && (
        <div className="relative h-32 rounded-lg overflow-hidden border border-border">
          <Image src={value} alt="Preview" fill className="object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => {
          onChange(url);
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
