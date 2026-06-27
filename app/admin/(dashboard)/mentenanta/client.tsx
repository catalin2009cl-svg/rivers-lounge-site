'use client';

import { useState, useTransition } from 'react';
import { Wrench, Loader2, CheckCircle2, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
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
import { toggleMaintenanceMode } from '@/lib/actions/maintenance';

export function MaintenanceAdminClient({
  initialEnabled,
  initialTitle,
  initialMessage,
}: {
  initialEnabled: boolean;
  initialTitle: string;
  initialMessage: string;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [title, setTitle] = useState(initialTitle);
  const [message, setMessage] = useState(initialMessage);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleToggle(value: boolean) {
    if (value) {
      setShowConfirm(true);
    } else {
      doToggle(false);
    }
  }

  function doToggle(value: boolean) {
    startTransition(async () => {
      const res = await toggleMaintenanceMode(value, title, message);
      if (res.success) {
        setEnabled(value);
        toast.success(value ? 'Mod mentenanță activat.' : 'Site activ.');
      } else {
        toast.error(res.error ?? 'Eroare la actualizare.');
      }
    });
  }

  function handleSaveText() {
    startTransition(async () => {
      const res = await toggleMaintenanceMode(enabled, title, message);
      if (res.success) {
        toast.success('Textele au fost salvate.');
      } else {
        toast.error(res.error ?? 'Eroare la salvare.');
      }
    });
  }

  return (
    <>
      {/* Status card */}
      <div
        className={`rounded-2xl border p-6 mb-6 transition-all ${
          enabled
            ? 'bg-red-500/5 border-red-500/30 dark:border-red-500/30'
            : 'bg-green-500/5 border-green-500/30 dark:border-green-500/30'
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                enabled ? 'bg-red-500/10' : 'bg-green-500/10'
              }`}
            >
              <Wrench className={`h-6 w-6 ${enabled ? 'text-red-500' : 'text-green-500'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-gray-900 dark:text-white">Stare curentă</p>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    enabled
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                      : 'bg-green-500/10 text-green-600 dark:text-green-400'
                  }`}
                >
                  {enabled ? '● MENTENANȚĂ ACTIVĂ' : '○ SITE ACTIV'}
                </span>
              </div>
              <p className={`text-sm ${enabled ? 'text-red-400' : 'text-green-500 dark:text-green-400'}`}>
                {enabled
                  ? 'Vizitatorii sunt redirecționați automat la pagina de mentenanță.'
                  : 'Site-ul este accesibil publicului.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {pending && <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />}
            <Switch
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={pending}
              className="data-[state=checked]:bg-red-500"
            />
          </div>
        </div>

        {enabled && (
          <div className="mt-4 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
            <p className="text-sm text-red-400">
              ⚠️ Site-ul este momentan în modul mentenanță. Adminii, managerii și operatorii cu sesiune activă pot accesa site-ul în continuare.
            </p>
          </div>
        )}
      </div>

      {/* Text fields */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/10 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
          Texte afișate vizitatorilor
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
              Titlu
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Revenim în curând"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
              Mesaj
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Lucrăm la ceva deosebit pentru voi. Ne întoarcem în curând!"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-gray-400">
              Textele sunt afișate pe pagina animată de mentenanță.
            </p>
            <button
              onClick={handleSaveText}
              disabled={pending}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Salvează textele
            </button>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/10 p-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
          Cum funcționează
        </h2>
        <ul className="space-y-3">
          {[
            { icon: CheckCircle2, color: 'text-green-500', text: 'Vizitatorii fără cont sunt redirecționați automat la pagina de mentenanță.' },
            { icon: CheckCircle2, color: 'text-green-500', text: 'Adminii, managerii și operatorii cu sesiune activă accesează site-ul normal.' },
            { icon: CheckCircle2, color: 'text-green-500', text: 'Panoul de administrare rămâne mereu accesibil.' },
            { icon: TriangleAlert, color: 'text-yellow-500', text: 'Clienții cu cont activ vor vedea și ei pagina de mentenanță.' },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-500 dark:text-gray-400">
              <item.icon className={`h-4 w-4 ${item.color} mt-0.5 shrink-0`} />
              {item.text}
            </li>
          ))}
        </ul>
      </div>

      {/* Confirmation dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activezi modul de mentenanță?</AlertDialogTitle>
            <AlertDialogDescription>
              Ești sigur că vrei să activezi modul de mentenanță? Vizitatorii nu vor putea accesa site-ul — vor fi redirecționați automat la pagina de mentenanță.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => doToggle(true)}
              className="bg-red-500 hover:bg-red-600 text-white border-red-500"
            >
              Activează mentenanța
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
