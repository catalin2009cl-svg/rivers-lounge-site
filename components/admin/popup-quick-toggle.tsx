'use client';

import { useState, useTransition } from 'react';
import { Megaphone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { togglePopup } from '@/lib/actions/settings';

interface PopupQuickToggleProps {
  enabled: boolean;
}

export function PopupQuickToggle({ enabled: initial }: PopupQuickToggleProps) {
  const [enabled, setEnabled] = useState(initial);
  const [pending, startTransition] = useTransition();

  function handleToggle(value: boolean) {
    setEnabled(value);
    startTransition(async () => {
      const result = await togglePopup(value);
      if (!result.success) {
        setEnabled(!value);
        toast.error(result.error ?? 'Eroare la actualizare.');
      } else {
        toast.success(value ? 'Popup activat.' : 'Popup dezactivat.');
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      {pending && <Loader2 className="h-3.5 w-3.5 text-gray-400 animate-spin" />}
      <Switch
        checked={enabled}
        onCheckedChange={handleToggle}
        disabled={pending}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );
}

export function PopupStatusDot({ enabled }: { enabled: boolean }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${enabled ? 'bg-green-400' : 'bg-gray-600'}`} />
  );
}
