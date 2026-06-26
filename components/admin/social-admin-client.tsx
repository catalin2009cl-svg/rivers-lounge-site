'use client';

import { useState } from 'react';
import { Facebook, Video, Plus, Trash2, Save, Globe2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { updateSocialSettings } from '@/lib/actions/social';
import type { SocialSettings } from '@/lib/server-data';

interface SocialAdminClientProps {
  initialSettings: SocialSettings;
}

function extractTikTokId(url: string): string | null {
  const match = url.match(/\/video\/(\d+)/);
  return match ? match[1] : null;
}

function extractFacebookVideoId(url: string): string | null {
  const match = url.match(/\/(?:reel|videos?)\/(\d+)/);
  return match ? match[1] : null;
}

export function SocialAdminClient({ initialSettings }: SocialAdminClientProps) {
  const [settings, setSettings] = useState<SocialSettings>(initialSettings);
  const [newFbUrl, setNewFbUrl] = useState('');
  const [newTikTokUrl, setNewTikTokUrl] = useState('');
  const [saving, setSaving] = useState(false);

  function addFacebookVideo() {
    const url = newFbUrl.trim();
    if (!url) return;
    const id = extractFacebookVideoId(url);
    if (!id) {
      toast.error('URL invalid. Exemplu: https://www.facebook.com/reel/755083307014298');
      return;
    }
    if (settings.facebookVideos.some((v) => v.id === id)) {
      toast.error('Acest video este deja adăugat.');
      return;
    }
    setSettings((s) => ({
      ...s,
      facebookVideos: [...s.facebookVideos, { id, url }],
    }));
    setNewFbUrl('');
  }

  function removeFacebookVideo(id: string) {
    setSettings((s) => ({
      ...s,
      facebookVideos: s.facebookVideos.filter((v) => v.id !== id),
    }));
  }

  function addTikTokVideo() {
    const url = newTikTokUrl.trim();
    if (!url) return;
    const id = extractTikTokId(url);
    if (!id) {
      toast.error('URL TikTok invalid. Exemplu: https://www.tiktok.com/@user/video/1234567890');
      return;
    }
    if (settings.tiktokVideos.some((v) => v.id === id)) {
      toast.error('Acest video este deja adăugat.');
      return;
    }
    setSettings((s) => ({
      ...s,
      tiktokVideos: [...s.tiktokVideos, { id, url }],
    }));
    setNewTikTokUrl('');
  }

  function removeTikTokVideo(id: string) {
    setSettings((s) => ({
      ...s,
      tiktokVideos: s.tiktokVideos.filter((v) => v.id !== id),
    }));
  }

  async function handleSave() {
    setSaving(true);
    const result = await updateSocialSettings(settings);
    setSaving(false);
    if (result.success) {
      toast.success('Setări salvate!');
    } else {
      toast.error(result.error ?? 'Eroare la salvare.');
    }
  }

  return (
    <div className="p-6 lg:p-8 pt-20 lg:pt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Globe2 className="h-6 w-6 text-primary" />
            Social Media
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configurează integrarea cu rețelele sociale
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Se salvează...' : 'Salvează setările'}
        </Button>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Facebook Videos */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Facebook className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800 dark:text-white">Facebook</p>
              <p className="text-xs text-gray-400">Afișează Reels/Video-uri Facebook pe site (max 3)</p>
            </div>
            <Switch
              checked={settings.showFacebook}
              onCheckedChange={(v) => setSettings((s) => ({ ...s, showFacebook: v }))}
            />
          </div>

          <div className="space-y-1.5 mb-4">
            <Label>Adaugă URL Reel / Video Facebook</Label>
            <div className="flex gap-2">
              <Input
                value={newFbUrl}
                onChange={(e) => setNewFbUrl(e.target.value)}
                placeholder="https://www.facebook.com/reel/755083307014298"
                onKeyDown={(e) => e.key === 'Enter' && addFacebookVideo()}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addFacebookVideo}
                disabled={!newFbUrl.trim() || settings.facebookVideos.length >= 3}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              Copiază URL-ul de pe Facebook (ex: facebook.com/reel/ID sau facebook.com/pagina/videos/ID).
              Funcționează pe localhost și pe riverslounge.ro fără configurare suplimentară.
            </p>
          </div>

          {settings.facebookVideos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Niciun video adăugat.</p>
          ) : (
            <div className="space-y-2">
              {settings.facebookVideos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-white/5"
                >
                  <div className="w-6 h-6 rounded bg-blue-500/10 flex items-center justify-center shrink-0">
                    <span className="text-blue-500 text-xs font-bold">f</span>
                  </div>
                  <p className="flex-1 text-xs text-gray-500 truncate">{video.url}</p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-gray-400 hover:text-destructive shrink-0"
                    onClick={() => removeFacebookVideo(video.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TikTok */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gray-900/10 dark:bg-white/10 flex items-center justify-center shrink-0">
              <Video className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800 dark:text-white">TikTok</p>
              <p className="text-xs text-gray-400">Afișează videoclipuri TikTok pe site (max 3)</p>
            </div>
            <Switch
              checked={settings.showTiktok}
              onCheckedChange={(v) => setSettings((s) => ({ ...s, showTiktok: v }))}
            />
          </div>

          <div className="space-y-1.5 mb-4">
            <Label>Adaugă video TikTok</Label>
            <div className="flex gap-2">
              <Input
                value={newTikTokUrl}
                onChange={(e) => setNewTikTokUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@user/video/1234567890"
                onKeyDown={(e) => e.key === 'Enter' && addTikTokVideo()}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addTikTokVideo}
                disabled={!newTikTokUrl.trim() || settings.tiktokVideos.length >= 3}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-400">Maxim 3 videoclipuri. URL format: tiktok.com/@user/video/ID</p>
          </div>

          {settings.tiktokVideos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Niciun video adăugat.</p>
          ) : (
            <div className="space-y-2">
              {settings.tiktokVideos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-white/5"
                >
                  <p className="flex-1 text-xs text-gray-500 truncate">{video.url}</p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-gray-400 hover:text-destructive shrink-0"
                    onClick={() => removeTikTokVideo(video.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-sm text-gray-400 bg-gray-50 dark:bg-white/5 rounded-xl p-4">
          Secțiunea Social Media apare pe pagina principală doar dacă cel puțin una dintre opțiuni este activată și are videoclipuri adăugate.
        </div>
      </div>
    </div>
  );
}
