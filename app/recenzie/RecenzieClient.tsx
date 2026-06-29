'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';

const STAR_LABELS = ['', 'Dezamăgitor', 'Slab', 'Acceptabil', 'Bun', 'Excelent'];

export function RecenzieClient() {
  const params = useSearchParams();
  const router = useRouter();

  const token = params.get('token') ?? '';
  const orderId = params.get('orderId') ?? '';
  const initialRating = Number(params.get('rating') ?? 0);

  const [rating, setRating] = useState(initialRating);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'duplicate'>('idle');

  const displayRating = hovered || rating;

  async function handleSubmit() {
    if (!rating) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, orderId, rating, comment }),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (res.ok && json.ok) {
        setStatus('success');
      } else if (res.status === 409) {
        setStatus('duplicate');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (!token || !orderId) {
    return (
      <PageShell>
        <p className="text-[#9A9490] text-sm">Link invalid. Te rugăm să folosești linkul primit în email.</p>
      </PageShell>
    );
  }

  if (status === 'success') {
    return (
      <PageShell>
        <div className="text-center">
          <div className="text-5xl mb-4">🙏</div>
          <h2 className="text-xl font-bold text-[#F0EDE6] mb-2">Mulțumim pentru recenzie!</h2>
          <p className="text-[#9A9490] text-sm mb-6">Feedback-ul tău ne ajută să ne îmbunătățim.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: '#C9A84C', color: '#0F0F0F' }}
          >
            Înapoi la site
          </button>
        </div>
      </PageShell>
    );
  }

  if (status === 'duplicate') {
    return (
      <PageShell>
        <div className="text-center">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-lg font-bold text-[#F0EDE6] mb-2">Ai lăsat deja o recenzie</h2>
          <p className="text-[#9A9490] text-sm">Această comandă a primit deja o recenzie. Mulțumim!</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <h2 className="text-xl font-bold text-[#F0EDE6] mb-1">Cum a fost experiența?</h2>
      <p className="text-[#9A9490] text-sm mb-6">
        Comanda <span className="text-[#C9A84C] font-mono">#{orderId.slice(-8).toUpperCase()}</span>
      </p>

      {/* Stars */}
      <div className="flex gap-2 justify-center mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(n)}
            className="text-4xl transition-transform hover:scale-110"
            style={{ color: n <= displayRating ? '#C9A84C' : '#2E2E2E' }}
          >
            ★
          </button>
        ))}
      </div>

      {displayRating > 0 && (
        <p className="text-center text-sm text-[#C9A84C] mb-5 font-medium">{STAR_LABELS[displayRating]}</p>
      )}

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Comentariu opțional..."
        rows={3}
        maxLength={500}
        className="w-full rounded-lg text-sm resize-none outline-none"
        style={{
          background: '#0F0F0F',
          border: '1px solid #2E2E2E',
          color: '#F0EDE6',
          padding: '10px 14px',
          marginBottom: 16,
        }}
      />

      {status === 'error' && (
        <p className="text-[#F87171] text-sm mb-3">A apărut o eroare. Încearcă din nou.</p>
      )}

      <button
        disabled={!rating || status === 'loading'}
        onClick={handleSubmit}
        className="w-full py-3 rounded-lg font-semibold text-sm transition-opacity"
        style={{
          background: '#C9A84C',
          color: '#0F0F0F',
          opacity: !rating || status === 'loading' ? 0.5 : 1,
          cursor: !rating || status === 'loading' ? 'not-allowed' : 'pointer',
        }}
      >
        {status === 'loading' ? 'Se trimite...' : 'Trimite recenzia'}
      </button>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#0F0F0F' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}
      >
        <div className="text-center mb-6">
          <p className="text-xs font-bold tracking-widest" style={{ color: '#C9A84C' }}>
            RIVERS LOUNGE
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
