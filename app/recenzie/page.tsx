import { Suspense } from 'react';
import { RecenzieClient } from './RecenzieClient';

export const metadata = { title: 'Lasă o recenzie — Rivers Lounge' };

export default function RecenziePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" />}>
      <RecenzieClient />
    </Suspense>
  );
}
