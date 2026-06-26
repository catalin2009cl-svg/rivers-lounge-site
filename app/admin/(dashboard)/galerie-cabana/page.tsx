import { getCabanaGallery } from '@/lib/server-data';
import { CabanaGalleryClient } from '@/components/admin/cabana-gallery-client';
import { Images } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function GalerieCabanaPage() {
  const photos = await getCabanaGallery();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Images className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Galerie Cabana Rivers</h1>
          <p className="text-sm text-muted-foreground">
            Gestionează fotografiile afișate în galeria paginii Cabana
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <CabanaGalleryClient initialPhotos={photos} />
      </div>
    </div>
  );
}
