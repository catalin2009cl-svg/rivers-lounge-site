'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

const REQUEST_TYPES: Record<string, string> = {
  delete: 'Ștergere date personale',
  access: 'Acces la datele mele',
  portability: 'Export date (portabilitate)',
  rectification: 'Rectificare date incorecte',
  objection: 'Obiecție la prelucrare',
};

export function GdprRequestForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [requestType, setRequestType] = useState('delete');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`Solicitare GDPR — ${REQUEST_TYPES[requestType]}`);
    const body = encodeURIComponent(
      `Nume: ${name}\nEmail: ${email}\nTip solicitare: ${REQUEST_TYPES[requestType]}\nDetalii: ${details || '—'}\n\nTrimis de pe riverslounge.ro/cookies`
    );
    window.open(`mailto:renetrading@yahoo.com?subject=${subject}&body=${body}`);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-6 flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        <div>
          <p className="font-semibold text-foreground">Solicitarea ta a fost trimisă!</p>
          <p className="text-sm text-muted-foreground mt-1">
            Vom răspunde la adresa <span className="text-foreground">{email}</span> în termen de 30 de zile.
          </p>
        </div>
      </div>
    );
  }

  const inputStyle = {
    background: '#1A1A1A',
    border: '1px solid #2E2E2E',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#F0EDE6',
    width: '100%',
    fontSize: '14px',
    outline: 'none',
  } as const;

  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-5 space-y-4">
      <div>
        <h3 className="font-semibold text-foreground text-sm">Solicită ștergerea datelor tale</h3>
        <p style={{ color: '#9A9490', fontSize: '14px', marginTop: '4px' }}>
          Completează formularul de mai jos și vom procesa cererea ta în termen de 30 de zile.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input
          type="text"
          placeholder="Numele tău complet *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="email"
          placeholder="Adresa de email *"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
        <select
          value={requestType}
          onChange={(e) => setRequestType(e.target.value)}
          style={inputStyle}
        >
          {Object.entries(REQUEST_TYPES).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <textarea
          placeholder="Detalii suplimentare (opțional)"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
        <button
          type="submit"
          style={{
            background: '#C9A84C',
            color: '#0F0F0F',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '15px',
          }}
        >
          Trimite solicitarea
        </button>
      </form>
    </div>
  );
}
