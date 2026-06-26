'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export function AdminNotice() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('acces') === 'interzis') {
      toast.error('⛔ Nu ai permisiuni pentru această secțiune.');
      window.history.replaceState({}, '', '/admin');
    }
  }, []);

  return null;
}
