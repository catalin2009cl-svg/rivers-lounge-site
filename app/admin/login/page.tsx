'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock, Waves } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'admin' | 'operator'>('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await loginAction(password, mode === 'operator' ? username : undefined);
      if (result.error) {
        setError(result.error);
      } else {
        router.push('/admin');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 mb-4">
            <Waves className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-white mb-1">River&apos;s Lounge</h1>
          <p className="text-sm text-gray-400">Panou de administrare</p>
        </div>

        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-white">Autentificare</h2>
          </div>

          {/* Admin / Operator toggle */}
          <div style={{ display: 'flex', background: '#0F0F0F', borderRadius: 8, padding: 4, marginBottom: 20, border: '1px solid #2E2E2E' }}>
            {(['admin', 'operator'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1,
                  background: mode === m ? '#C9A84C' : 'transparent',
                  color: mode === m ? '#0F0F0F' : '#9A9490',
                  fontWeight: mode === m ? 700 : 400,
                  border: 'none',
                  borderRadius: 6,
                  padding: '7px 0',
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {m === 'admin' ? '🔐 Administrator' : '👷 Operator'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'operator' && (
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-300 text-sm">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username operator"
                  required
                  autoFocus
                  autoComplete="username"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary/50"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 text-sm">
                Parolă
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'admin' ? 'Parolă administrator' : 'Parolă operator'}
                  required
                  autoFocus={mode === 'admin'}
                  autoComplete="current-password"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pr-10 focus:border-primary/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !password || (mode === 'operator' && !username)}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11"
            >
              {loading ? 'Se verifică...' : 'Intră în panou'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          © {new Date().getFullYear()} River&apos;s Lounge — Acces restricționat
        </p>
      </div>
    </div>
  );
}
