'use client';

import { useState } from 'react';
import { Phone, Mail, Clock, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SupportRequestRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: 'Nou', color: '#C9A84C' },
  read: { label: 'Citit', color: '#60A5FA' },
  replied: { label: 'Răspuns', color: '#4ADE80' },
  closed: { label: 'Închis', color: '#9A9490' },
};

export function SupportAdminClient({ initialRequests }: { initialRequests: SupportRequestRow[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [filter, setFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);
  const newCount = requests.filter((r) => r.status === 'new').length;

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      const res = await fetch('/api/admin/suport/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
      }
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(STATUS_LABELS).map(([key, { label, color }]) => {
          const count = requests.filter((r) => r.status === key).length;
          return (
            <div key={key} className="rounded-xl border border-[#2E2E2E] bg-[#1A1A1A] px-4 py-3">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className="text-2xl font-bold" style={{ color }}>{count}</p>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: `Toate (${requests.length})` },
          { key: 'new', label: `Noi${newCount > 0 ? ` (${newCount})` : ''}` },
          { key: 'read', label: 'Citite' },
          { key: 'replied', label: 'Răspuns' },
          { key: 'closed', label: 'Închise' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === key
                ? 'bg-[#C9A84C] text-[#0F0F0F]'
                : 'bg-[#1A1A1A] text-gray-400 border border-[#2E2E2E] hover:border-[#3E3E3E] hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[#2E2E2E] bg-[#1A1A1A] py-16 text-center">
          <MessageSquare className="h-10 w-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Niciun mesaj în această categorie.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((req) => {
            const isExpanded = expandedId === req.id;
            const st = STATUS_LABELS[req.status] ?? { label: req.status, color: '#9A9490' };
            return (
              <div
                key={req.id}
                className="rounded-xl border border-[#2E2E2E] bg-[#1A1A1A] overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  className="w-full flex items-start sm:items-center justify-between gap-4 p-4 text-left hover:bg-[#222] transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full shrink-0 mt-1.5 sm:mt-0"
                      style={{ background: st.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span className="font-medium text-white text-sm">{req.name}</span>
                        <span className="text-xs text-gray-500">{req.email}</span>
                        {req.phone && <span className="text-xs text-gray-600">{req.phone}</span>}
                      </div>
                      <p className="text-xs text-[#C9A84C] mt-0.5">{req.subject}</p>
                      {!isExpanded && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs sm:max-w-sm">
                          {req.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-gray-600 hidden sm:block">
                      {new Date(req.createdAt).toLocaleDateString('ro-RO', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                      style={{ color: st.color, background: `${st.color}18` }}
                    >
                      {st.label}
                    </span>
                    {isExpanded
                      ? <ChevronUp className="h-4 w-4 text-gray-500" />
                      : <ChevronDown className="h-4 w-4 text-gray-500" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-[#2E2E2E] p-4 space-y-4">
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(req.createdAt).toLocaleString('ro-RO')}
                      </span>
                      <a href={`mailto:${req.email}`} className="flex items-center gap-1.5 hover:text-[#C9A84C] transition-colors">
                        <Mail className="h-3.5 w-3.5" />
                        {req.email}
                      </a>
                      {req.phone && (
                        <a href={`tel:${req.phone}`} className="flex items-center gap-1.5 hover:text-[#C9A84C] transition-colors">
                          <Phone className="h-3.5 w-3.5" />
                          {req.phone}
                        </a>
                      )}
                    </div>

                    <div className="rounded-lg bg-[#111] border border-[#2E2E2E] px-4 py-3">
                      <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{req.message}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-gray-500 mr-1">Schimbă status:</span>
                      {Object.entries(STATUS_LABELS).map(([key, { label, color }]) => (
                        <button
                          key={key}
                          disabled={req.status === key || updating === req.id}
                          onClick={() => updateStatus(req.id, key)}
                          className="px-3 py-1 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          style={
                            req.status === key
                              ? { borderColor: color, color, background: `${color}15` }
                              : { borderColor: '#2E2E2E', color: '#9A9490' }
                          }
                        >
                          {label}
                        </button>
                      ))}
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="ml-auto h-7 text-xs border-[#2E2E2E] text-gray-400 hover:border-[#C9A84C] hover:text-[#C9A84C]"
                      >
                        <a href={`mailto:${req.email}?subject=Re: ${encodeURIComponent(req.subject)}`}>
                          Răspunde prin email
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
