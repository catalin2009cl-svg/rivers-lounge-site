'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────────

type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'CANCELLED';
type TemplateType   = 'PROMO' | 'MENU' | 'EVENT' | 'CUSTOM';
type Segment        = 'all' | 'level1' | 'level2plus' | 'level3plus' | 'inactive30' | 'inactive60' | 'newLast30';

interface Campaign {
  id:             string;
  title:          string;
  subject:        string;
  status:         string;
  template:       string;
  segments:       string[];
  scheduledAt:    string | null;
  sentAt:         string | null;
  recipientCount: number;
  openCount:      number;
  clickCount:     number;
  createdAt:      string;
}

interface Subscriber {
  id:               string;
  name:             string;
  email:            string;
  marketingConsent: boolean;
  consentAt:        string | null;
  unsubscribedAt:   string | null;
  lastOrderAt:      string | null;
  loyaltyLevel:     number | null;
}

interface Props {
  campaigns:        Campaign[];
  totalSubscribers: number;
  totalUnsubscribed:number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  DRAFT:     'Ciornă',
  SCHEDULED: 'Programat',
  SENDING:   'Se trimite',
  SENT:      'Trimis',
  CANCELLED: 'Anulat',
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT:     '#6B6660',
  SCHEDULED: '#C9A84C',
  SENDING:   '#3B82F6',
  SENT:      '#4ADE80',
  CANCELLED: '#EF4444',
};

const TEMPLATE_LABEL: Record<string, string> = {
  PROMO:  'Promoție',
  MENU:   'Meniu',
  EVENT:  'Eveniment',
  CUSTOM: 'Personalizat',
};

const SEGMENT_LABEL: Record<string, string> = {
  all:        'Toți abonații',
  level1:     'Nivel 1',
  level2plus: 'Nivel 2+',
  level3plus: 'Nivel 3',
  inactive30: 'Inactivi 30 zile',
  inactive60: 'Inactivi 60 zile',
  newLast30:  'Noi (30 zile)',
};

// ── Wizard step interfaces ─────────────────────────────────────────────────────

interface WizardData {
  title:       string;
  subject:     string;
  template:    TemplateType;
  segments:    Segment[];
  content:     Record<string, string>;
  scheduleNow: boolean;
  scheduledAt: string;
}

const DEFAULT_WIZARD: WizardData = {
  title:       '',
  subject:     '',
  template:    'PROMO',
  segments:    ['all'],
  content:     {},
  scheduleNow: true,
  scheduledAt: '',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function pct(part: number, total: number) {
  if (!total) return '0%';
  return `${Math.round((part / total) * 100)}%`;
}

function Bar({ value, max, color = '#C9A84C' }: { value: number; max: number; color?: string }) {
  const w = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ height: 6, background: '#2A2A2A', borderRadius: 3, overflow: 'hidden', minWidth: 80 }}>
      <div style={{ height: '100%', width: `${w}%`, background: color, borderRadius: 3, transition: 'width 0.4s' }} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function MarketingClient({ campaigns: initial, totalSubscribers, totalUnsubscribed }: Props) {
  const [tab, setTab]               = useState<'campanii' | 'abonati' | 'statistici'>('campanii');
  const [campaigns, setCampaigns]   = useState<Campaign[]>(initial);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [wizard, setWizard]         = useState<WizardData>(DEFAULT_WIZARD);
  const [wizardStep, setWizardStep] = useState(0);
  const [saving, setSaving]         = useState(false);
  const [sending, setSending]       = useState<string | null>(null);
  const [preview, setPreview]       = useState<{ html: string; id: string } | null>(null);
  const [subsFilter, setSubsFilter] = useState('');

  const loadSubscribers = useCallback(async () => {
    if (subscribers.length > 0) return;
    setLoadingSubs(true);
    try {
      const r = await fetch('/api/admin/marketing/subscribers');
      const d = await r.json() as { subscribers: Subscriber[] };
      setSubscribers(d.subscribers);
    } catch {
      toast.error('Eroare la încărcarea abonaților');
    } finally {
      setLoadingSubs(false);
    }
  }, [subscribers.length]);

  useEffect(() => {
    if (tab === 'abonati') loadSubscribers();
  }, [tab, loadSubscribers]);

  // ── Wizard save ──────────────────────────────────────────────────────────────

  async function saveDraft() {
    setSaving(true);
    try {
      const r = await fetch('/api/admin/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:    wizard.title,
          subject:  wizard.subject,
          template: wizard.template,
          segments: wizard.segments,
          content:  wizard.content,
        }),
      });
      if (!r.ok) throw new Error('save failed');
      const d = await r.json() as { id: string };
      const campaign: Campaign = {
        id: d.id, title: wizard.title, subject: wizard.subject,
        status: 'DRAFT', template: wizard.template, segments: wizard.segments,
        scheduledAt: null, sentAt: null, recipientCount: 0,
        openCount: 0, clickCount: 0, createdAt: new Date().toISOString(),
      };
      setCampaigns((prev) => [campaign, ...prev]);

      if (wizard.scheduleNow) {
        await sendCampaign(campaign.id, false);
      } else if (wizard.scheduledAt) {
        await fetch(`/api/admin/marketing/campaigns/${campaign.id}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduledAt: wizard.scheduledAt }),
        });
        setCampaigns((prev) => prev.map((c) => c.id === campaign.id ? { ...c, status: 'SCHEDULED', scheduledAt: wizard.scheduledAt } : c));
        toast.success('Campanie programată');
      } else {
        toast.success('Campanie salvată ca ciornă');
      }

      setShowWizard(false);
      setWizard(DEFAULT_WIZARD);
      setWizardStep(0);
    } catch {
      toast.error('Eroare la salvarea campaniei');
    } finally {
      setSaving(false);
    }
  }

  async function sendCampaign(id: string, scheduled: boolean) {
    setSending(id);
    try {
      const r = await fetch(`/api/admin/marketing/campaigns/${id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!r.ok) throw new Error('send failed');
      if (scheduled) {
        setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, status: 'SENDING' } : c));
        toast.success('Campanie în curs de trimitere');
      }
    } catch {
      toast.error('Eroare la trimiterea campaniei');
    } finally {
      setSending(null);
    }
  }

  async function cancelCampaign(id: string) {
    if (!confirm('Anulezi campania programată?')) return;
    const r = await fetch(`/api/admin/marketing/campaigns/${id}/cancel`, { method: 'POST' });
    if (r.ok) {
      setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, status: 'CANCELLED' } : c));
      toast.success('Campanie anulată');
    }
  }

  async function deleteCampaign(id: string) {
    if (!confirm('Ștergi definitiv această campanie?')) return;
    const r = await fetch(`/api/admin/marketing/campaigns/${id}`, { method: 'DELETE' });
    if (r.ok) {
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      toast.success('Campanie ștearsă');
    }
  }

  async function openPreview(id: string) {
    const r = await fetch(`/api/admin/marketing/campaigns/${id}/preview`);
    const d = await r.json() as { html: string };
    setPreview({ html: d.html, id });
  }

  async function exportCSV() {
    const r = await fetch('/api/admin/marketing/subscribers/export', { method: 'POST' });
    const blob = await r.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `abonati-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Wizard steps ─────────────────────────────────────────────────────────────

  const wizardSteps = [
    'Informații',
    'Șablon & Conținut',
    'Audiență',
    'Trimitere',
  ];

  function setW<K extends keyof WizardData>(key: K, val: WizardData[K]) {
    setWizard((p) => ({ ...p, [key]: val }));
  }

  function toggleSegment(seg: Segment) {
    setWizard((p) => {
      const has = p.segments.includes(seg);
      return { ...p, segments: has ? p.segments.filter((s) => s !== seg) : [...p.segments, seg] };
    });
  }

  // ── Stats ─────────────────────────────────────────────────────────────────────

  const sent = campaigns.filter((c) => c.status === 'SENT');
  const totalSent  = sent.reduce((s, c) => s + c.recipientCount, 0);
  const totalOpens = sent.reduce((s, c) => s + c.openCount, 0);
  const totalClicks= sent.reduce((s, c) => s + c.clickCount, 0);

  const filteredSubs = subscribers.filter((s) =>
    !subsFilter ||
    s.name.toLowerCase().includes(subsFilter.toLowerCase()) ||
    s.email.toLowerCase().includes(subsFilter.toLowerCase())
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '24px', maxWidth: 1200 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: '#E8E4DF', fontSize: 22, fontWeight: 700, margin: 0 }}>Marketing Email</h1>
          <p style={{ color: '#6B6660', fontSize: 13, marginTop: 4 }}>
            {totalSubscribers} abonați activi · {totalUnsubscribed} dezabonați
          </p>
        </div>
        <button
          onClick={() => { setShowWizard(true); setWizardStep(0); setWizard(DEFAULT_WIZARD); }}
          style={{ background: '#C9A84C', color: '#111', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          + Campanie nouă
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #2A2A2A', paddingBottom: 0 }}>
        {(['campanii', 'abonati', 'statistici'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: tab === t ? '#C9A84C' : '#6B6660',
              fontWeight: tab === t ? 600 : 400,
              fontSize: 14,
              padding: '8px 16px',
              borderBottom: tab === t ? '2px solid #C9A84C' : '2px solid transparent',
              marginBottom: -1,
              transition: 'color 0.15s',
            }}
          >
            {t === 'campanii' ? 'Campanii' : t === 'abonati' ? 'Abonați' : 'Statistici'}
          </button>
        ))}
      </div>

      {/* ── Tab: Campanii ── */}
      {tab === 'campanii' && (
        <div>
          {campaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B6660' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
              <p style={{ fontSize: 15 }}>Nicio campanie. Creează prima ta campanie!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {campaigns.map((c) => (
                <div key={c.id} style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ color: '#E8E4DF', fontSize: 14, fontWeight: 600 }}>{c.title}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: STATUS_COLOR[c.status] ?? '#6B6660', background: `${STATUS_COLOR[c.status] ?? '#6B6660'}22`, padding: '2px 7px', borderRadius: 20 }}>
                          {STATUS_LABEL[c.status] ?? c.status}
                        </span>
                        <span style={{ fontSize: 11, color: '#6B6660', background: '#2A2A2A', padding: '2px 7px', borderRadius: 20 }}>
                          {TEMPLATE_LABEL[c.template] ?? c.template}
                        </span>
                      </div>
                      <p style={{ color: '#9A9490', fontSize: 12, marginBottom: 6 }}>Subiect: {c.subject}</p>
                      {c.status === 'SENT' && (
                        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6B6660' }}>
                          <span>Trimis: <b style={{ color: '#E8E4DF' }}>{c.recipientCount}</b></span>
                          <span>Deschis: <b style={{ color: '#C9A84C' }}>{c.openCount} ({pct(c.openCount, c.recipientCount)})</b></span>
                          <span>Click: <b style={{ color: '#4ADE80' }}>{c.clickCount} ({pct(c.clickCount, c.recipientCount)})</b></span>
                          {c.sentAt && <span>La: {fmt(c.sentAt)}</span>}
                        </div>
                      )}
                      {c.status === 'SCHEDULED' && c.scheduledAt && (
                        <p style={{ fontSize: 12, color: '#C9A84C' }}>Programat: {fmt(c.scheduledAt)}</p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => openPreview(c.id)} style={btnStyle('#2A2A2A', '#9A9490')}>Preview</button>
                      {c.status === 'DRAFT' && (
                        <>
                          <button onClick={() => sendCampaign(c.id, true)} disabled={sending === c.id} style={btnStyle('#C9A84C22', '#C9A84C')}>
                            {sending === c.id ? '...' : 'Trimite'}
                          </button>
                          <button onClick={() => deleteCampaign(c.id)} style={btnStyle('#EF444422', '#EF4444')}>Șterge</button>
                        </>
                      )}
                      {c.status === 'SCHEDULED' && (
                        <button onClick={() => cancelCampaign(c.id)} style={btnStyle('#EF444422', '#EF4444')}>Anulează</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Abonați ── */}
      {tab === 'abonati' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
            <input
              type="text"
              placeholder="Caută după nume sau email..."
              value={subsFilter}
              onChange={(e) => setSubsFilter(e.target.value)}
              style={{ flex: 1, maxWidth: 340, background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, padding: '8px 12px', color: '#E8E4DF', fontSize: 13 }}
            />
            <button onClick={exportCSV} style={btnStyle('#C9A84C22', '#C9A84C')}>Export CSV</button>
          </div>

          {loadingSubs ? (
            <p style={{ color: '#6B6660', fontSize: 14 }}>Se încarcă...</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
                    {['Nume', 'Email', 'Status', 'Abonat la', 'Dezabonat la', 'Nivel'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#6B6660', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSubs.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #1E1E1E' }}>
                      <td style={{ padding: '8px 10px', color: '#E8E4DF' }}>{s.name}</td>
                      <td style={{ padding: '8px 10px', color: '#9A9490' }}>{s.email}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: s.unsubscribedAt ? '#EF4444' : s.marketingConsent ? '#4ADE80' : '#6B6660', background: s.unsubscribedAt ? '#EF444422' : s.marketingConsent ? '#4ADE8022' : '#2A2A2A', padding: '2px 7px', borderRadius: 20 }}>
                          {s.unsubscribedAt ? 'Dezabonat' : s.marketingConsent ? 'Abonat' : 'Inactiv'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', color: '#6B6660' }}>{fmt(s.consentAt)}</td>
                      <td style={{ padding: '8px 10px', color: '#6B6660' }}>{fmt(s.unsubscribedAt)}</td>
                      <td style={{ padding: '8px 10px', color: '#C9A84C' }}>{s.loyaltyLevel ? `Nivel ${s.loyaltyLevel}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredSubs.length === 0 && (
                <p style={{ textAlign: 'center', color: '#6B6660', padding: '40px 0', fontSize: 14 }}>Niciun rezultat.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Statistici ── */}
      {tab === 'statistici' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {[
            { label: 'Abonați activi',    value: totalSubscribers,  color: '#4ADE80' },
            { label: 'Dezabonați',         value: totalUnsubscribed, color: '#EF4444' },
            { label: 'Campanii trimise',   value: sent.length,       color: '#C9A84C' },
            { label: 'Total emailuri',     value: totalSent,         color: '#3B82F6' },
          ].map((s) => (
            <div key={s.label} style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '18px 20px' }}>
              <p style={{ color: '#6B6660', fontSize: 12, marginBottom: 6 }}>{s.label}</p>
              <p style={{ color: s.color, fontSize: 28, fontWeight: 700 }}>{s.value.toLocaleString('ro-RO')}</p>
            </div>
          ))}

          {sent.length > 0 && (
            <>
              <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '18px 20px' }}>
                <p style={{ color: '#6B6660', fontSize: 12, marginBottom: 6 }}>Rată deschidere medie</p>
                <p style={{ color: '#C9A84C', fontSize: 28, fontWeight: 700 }}>{pct(totalOpens, totalSent)}</p>
                <Bar value={totalOpens} max={totalSent} color="#C9A84C" />
              </div>
              <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '18px 20px' }}>
                <p style={{ color: '#6B6660', fontSize: 12, marginBottom: 6 }}>Rată click medie</p>
                <p style={{ color: '#4ADE80', fontSize: 28, fontWeight: 700 }}>{pct(totalClicks, totalSent)}</p>
                <Bar value={totalClicks} max={totalSent} color="#4ADE80" />
              </div>
            </>
          )}

          {/* Top campaigns */}
          {sent.length > 0 && (
            <div style={{ gridColumn: '1 / -1', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '18px 20px' }}>
              <p style={{ color: '#9A9490', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Top campanii (după rată deschidere)</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
                    {['Campanie', 'Trimise', 'Deschise', 'Clickuri', 'Rată desc.'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: '#6B6660', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...sent].sort((a, b) => (b.openCount / (b.recipientCount || 1)) - (a.openCount / (a.recipientCount || 1))).slice(0, 10).map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #1E1E1E' }}>
                      <td style={{ padding: '6px 8px', color: '#E8E4DF' }}>{c.title}</td>
                      <td style={{ padding: '6px 8px', color: '#9A9490' }}>{c.recipientCount}</td>
                      <td style={{ padding: '6px 8px', color: '#C9A84C' }}>{c.openCount}</td>
                      <td style={{ padding: '6px 8px', color: '#4ADE80' }}>{c.clickCount}</td>
                      <td style={{ padding: '6px 8px', color: '#E8E4DF', fontWeight: 600 }}>{pct(c.openCount, c.recipientCount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Preview modal ── */}
      {preview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000000CC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#1A1A1A', borderRadius: 12, width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #2A2A2A' }}>
              <span style={{ color: '#E8E4DF', fontWeight: 600 }}>Preview email</span>
              <button onClick={() => setPreview(null)} style={{ background: 'none', border: 'none', color: '#6B6660', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 0 }}>
              <iframe
                srcDoc={preview.html}
                style={{ width: '100%', height: 600, border: 'none' }}
                title="Email preview"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Wizard modal ── */}
      {showWizard && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: '#000000CC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#1A1A1A', borderRadius: 12, width: '100%', maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            {/* Wizard header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #2A2A2A' }}>
              <span style={{ color: '#E8E4DF', fontWeight: 600 }}>Campanie nouă — {wizardSteps[wizardStep]}</span>
              <button onClick={() => setShowWizard(false)} style={{ background: 'none', border: 'none', color: '#6B6660', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>

            {/* Step indicators */}
            <div style={{ display: 'flex', gap: 0, padding: '0 18px', borderBottom: '1px solid #2A2A2A' }}>
              {wizardSteps.map((s, i) => (
                <div key={s} style={{ flex: 1, textAlign: 'center', padding: '8px 0', fontSize: 11, color: i === wizardStep ? '#C9A84C' : i < wizardStep ? '#4ADE80' : '#6B6660', fontWeight: i === wizardStep ? 600 : 400, borderBottom: i === wizardStep ? '2px solid #C9A84C' : '2px solid transparent', marginBottom: -1 }}>
                  {i + 1}. {s}
                </div>
              ))}
            </div>

            {/* Step content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '20px 18px' }}>

              {/* Step 0: Info */}
              {wizardStep === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Field label="Nume campanie">
                    <input value={wizard.title} onChange={(e) => setW('title', e.target.value)} placeholder="Ex: Ofertă de vară" style={inputStyle} />
                  </Field>
                  <Field label="Subiect email">
                    <input value={wizard.subject} onChange={(e) => setW('subject', e.target.value)} placeholder="Ex: 🌞 Oferte speciale pentru tine!" style={inputStyle} />
                  </Field>
                </div>
              )}

              {/* Step 1: Template & Content */}
              {wizardStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Field label="Tip șablon">
                    <select value={wizard.template} onChange={(e) => setW('template', e.target.value as TemplateType)} style={inputStyle}>
                      {(Object.entries(TEMPLATE_LABEL) as [TemplateType, string][]).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </Field>

                  {wizard.template === 'PROMO' && (
                    <>
                      <Field label="Titlu promoție"><input value={wizard.content.title ?? ''} onChange={(e) => setW('content', { ...wizard.content, title: e.target.value })} style={inputStyle} /></Field>
                      <Field label="Descriere"><textarea rows={3} value={wizard.content.description ?? ''} onChange={(e) => setW('content', { ...wizard.content, description: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
                      <Field label="Ofertă (ex: -20% la toate)"><input value={wizard.content.offer ?? ''} onChange={(e) => setW('content', { ...wizard.content, offer: e.target.value })} style={inputStyle} /></Field>
                      <Field label="Text buton CTA"><input value={wizard.content.ctaText ?? ''} onChange={(e) => setW('content', { ...wizard.content, ctaText: e.target.value })} placeholder="Ex: Comandă acum" style={inputStyle} /></Field>
                      <Field label="URL buton CTA"><input value={wizard.content.ctaUrl ?? ''} onChange={(e) => setW('content', { ...wizard.content, ctaUrl: e.target.value })} placeholder="https://riverslounge.ro/..." style={inputStyle} /></Field>
                    </>
                  )}
                  {wizard.template === 'MENU' && (
                    <>
                      <Field label="Titlu"><input value={wizard.content.title ?? ''} onChange={(e) => setW('content', { ...wizard.content, title: e.target.value })} style={inputStyle} /></Field>
                      <Field label="Descriere"><textarea rows={3} value={wizard.content.description ?? ''} onChange={(e) => setW('content', { ...wizard.content, description: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
                      <Field label="Meniuri evidențiate (JSON sau text)"><textarea rows={4} value={wizard.content.items ?? ''} onChange={(e) => setW('content', { ...wizard.content, items: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
                    </>
                  )}
                  {wizard.template === 'EVENT' && (
                    <>
                      <Field label="Titlu eveniment"><input value={wizard.content.eventName ?? ''} onChange={(e) => setW('content', { ...wizard.content, eventName: e.target.value })} style={inputStyle} /></Field>
                      <Field label="Data și ora"><input value={wizard.content.eventDate ?? ''} onChange={(e) => setW('content', { ...wizard.content, eventDate: e.target.value })} style={inputStyle} /></Field>
                      <Field label="Descriere"><textarea rows={3} value={wizard.content.description ?? ''} onChange={(e) => setW('content', { ...wizard.content, description: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
                      <Field label="URL bilete / rezervare"><input value={wizard.content.ctaUrl ?? ''} onChange={(e) => setW('content', { ...wizard.content, ctaUrl: e.target.value })} style={inputStyle} /></Field>
                    </>
                  )}
                  {wizard.template === 'CUSTOM' && (
                    <Field label="Conținut HTML personalizat">
                      <textarea rows={10} value={wizard.content.body ?? ''} onChange={(e) => setW('content', { ...wizard.content, body: e.target.value })} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} />
                    </Field>
                  )}
                </div>
              )}

              {/* Step 2: Audiență */}
              {wizardStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ color: '#9A9490', fontSize: 13, marginBottom: 6 }}>Selectează segmentele de destinatari:</p>
                  {(Object.entries(SEGMENT_LABEL) as [Segment, string][]).map(([seg, label]) => (
                    <label key={seg} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', background: wizard.segments.includes(seg) ? '#C9A84C11' : '#111', border: `1px solid ${wizard.segments.includes(seg) ? '#C9A84C44' : '#2A2A2A'}`, borderRadius: 8 }}>
                      <input
                        type="checkbox"
                        checked={wizard.segments.includes(seg)}
                        onChange={() => toggleSegment(seg)}
                        style={{ accentColor: '#C9A84C' }}
                      />
                      <span style={{ color: '#E8E4DF', fontSize: 13 }}>{label}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Step 3: Trimitere */}
              {wizardStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: '#111', borderRadius: 8, padding: '14px 16px', border: '1px solid #2A2A2A' }}>
                    <p style={{ color: '#9A9490', fontSize: 12, marginBottom: 4 }}>Rezumat</p>
                    <p style={{ color: '#E8E4DF', fontSize: 13 }}><b>Campanie:</b> {wizard.title}</p>
                    <p style={{ color: '#E8E4DF', fontSize: 13 }}><b>Subiect:</b> {wizard.subject}</p>
                    <p style={{ color: '#E8E4DF', fontSize: 13 }}><b>Șablon:</b> {TEMPLATE_LABEL[wizard.template]}</p>
                    <p style={{ color: '#E8E4DF', fontSize: 13 }}><b>Segmente:</b> {wizard.segments.map((s) => SEGMENT_LABEL[s]).join(', ')}</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', background: wizard.scheduleNow ? '#C9A84C11' : '#111', border: `1px solid ${wizard.scheduleNow ? '#C9A84C44' : '#2A2A2A'}`, borderRadius: 8 }}>
                      <input type="radio" checked={wizard.scheduleNow} onChange={() => setW('scheduleNow', true)} style={{ accentColor: '#C9A84C' }} />
                      <div>
                        <span style={{ color: '#E8E4DF', fontSize: 13, fontWeight: 500 }}>Trimite acum</span>
                        <p style={{ color: '#6B6660', fontSize: 11, marginTop: 2 }}>Campania va fi trimisă imediat</p>
                      </div>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', background: !wizard.scheduleNow && wizard.scheduledAt ? '#C9A84C11' : '#111', border: `1px solid ${!wizard.scheduleNow && wizard.scheduledAt ? '#C9A84C44' : '#2A2A2A'}`, borderRadius: 8 }}>
                      <input type="radio" checked={!wizard.scheduleNow} onChange={() => setW('scheduleNow', false)} style={{ accentColor: '#C9A84C' }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ color: '#E8E4DF', fontSize: 13, fontWeight: 500 }}>Programează</span>
                        {!wizard.scheduleNow && (
                          <input
                            type="datetime-local"
                            value={wizard.scheduledAt}
                            onChange={(e) => setW('scheduledAt', e.target.value)}
                            style={{ ...inputStyle, marginTop: 8, display: 'block' }}
                          />
                        )}
                      </div>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', background: '#111', border: '1px solid #2A2A2A', borderRadius: 8 }}>
                      <input type="radio" checked={!wizard.scheduleNow && !wizard.scheduledAt} onChange={() => { setW('scheduleNow', false); setW('scheduledAt', ''); }} style={{ accentColor: '#C9A84C' }} />
                      <div>
                        <span style={{ color: '#E8E4DF', fontSize: 13, fontWeight: 500 }}>Salvează ca ciornă</span>
                        <p style={{ color: '#6B6660', fontSize: 11, marginTop: 2 }}>Poți trimite mai târziu</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Wizard footer */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '14px 18px', borderTop: '1px solid #2A2A2A' }}>
              {wizardStep > 0 && (
                <button onClick={() => setWizardStep((s) => s - 1)} style={btnStyle('#2A2A2A', '#9A9490')}>Înapoi</button>
              )}
              {wizardStep < wizardSteps.length - 1 ? (
                <button
                  onClick={() => setWizardStep((s) => s + 1)}
                  disabled={wizardStep === 0 && (!wizard.title || !wizard.subject)}
                  style={{ background: '#C9A84C', color: '#111', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: (wizardStep === 0 && (!wizard.title || !wizard.subject)) ? 0.4 : 1 }}
                >
                  Continuă
                </button>
              ) : (
                <button
                  onClick={saveDraft}
                  disabled={saving || wizard.segments.length === 0}
                  style={{ background: '#C9A84C', color: '#111', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  {saving ? 'Se salvează...' : wizard.scheduleNow ? 'Trimite campania' : wizard.scheduledAt ? 'Programează' : 'Salvează ciornă'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function btnStyle(bg: string, color: string): React.CSSProperties {
  return { background: bg, color, border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer' };
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#111', border: '1px solid #2A2A2A', borderRadius: 8,
  padding: '8px 12px', color: '#E8E4DF', fontSize: 13,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', color: '#9A9490', fontSize: 12, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}
