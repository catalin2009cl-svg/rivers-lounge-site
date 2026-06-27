'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { toggleMaintenanceMode } from '@/lib/actions/maintenance';

export function MaintenanceQuickToggle({
  enabled: initial,
  title,
  message,
}: {
  enabled: boolean;
  title: string;
  message: string;
}) {
  const [enabled, setEnabled] = useState(initial);
  const [pending, startTransition] = useTransition();

  function handleToggle(value: boolean) {
    setEnabled(value);
    startTransition(async () => {
      const res = await toggleMaintenanceMode(value, title, message);
      if (!res.success) {
        setEnabled(!value);
        toast.error(res.error ?? 'Eroare la actualizare.');
      } else {
        toast.success(value ? 'Site în mentenanță.' : 'Site activ.');
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
        className="data-[state=checked]:bg-red-500"
      />
    </div>
  );
}
