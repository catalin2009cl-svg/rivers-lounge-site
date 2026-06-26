import { listUploadedImages, getCabanaGallery, getRiversLandGallery, getRiversMarinaGallery } from '@/lib/server-data';
import { MediaAdminClient } from '@/components/admin/media-admin-client';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Media | Admin River\'s Lounge' };

export default async function MediaPage() {
  const [images, cabanaPhotos, rlPhotos, rmPhotos] = await Promise.all([
    listUploadedImages(),
    getCabanaGallery(),
    getRiversLandGallery(),
    getRiversMarinaGallery(),
  ]);

  return (
    <MediaAdminClient
      initialImages={images}
      initialCabanaPhotos={cabanaPhotos}
      initialRiversLandPhotos={rlPhotos}
      initialRiversMarinaPhotos={rmPhotos}
    />
  );
}
