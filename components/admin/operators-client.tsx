'use client';

import { useState, useTransition } from 'react';
import type { SafeOperator } from '@/app/admin/(dashboard)/utilizatori/page';
import {
  createOperator,
  updateOperator,
  resetOperatorPassword,
  toggleOperatorActive,
  deleteOperator,
} from '@/lib/actions/operators';

// ── helpers ───────────────────────────────────────────────────────────────────

function generateUsername(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.]/g, '')
    .slice(0, 20);
}

function generatePassword(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_MAP: Record<string, string> = {
  noua: 'Nouă', confirmata: 'Confirmată', 'in-pregatire': 'În Pregătire',
  livrata: 'Livrată', anulata: 'Anulată', acceptata: 'Acceptată', refuzata: 'Refuzată',
  'in-asteptare': 'În Așteptare',
};

type OperatorRole = 'manager' | 'operator';

const ROLE_LABELS: Record<OperatorRole, string> = {
  manager:  'Manager 🔧',
  operator: 'Operator 📦',
};

const ROLE_STYLE: Record<OperatorRole, React.CSSProperties> = {
  manager:  { background: 'rgba(59,130,246,0.15)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 999, padding: '2px 10px', fontSize: 12 },
  operator: { background: 'rgba(156,163,175,0.15)', color: '#9CA3AF', border: '1px solid rgba(156,163,175,0.3)', borderRadius: 999, padding: '2px 10px', fontSize: 12 },
};

// ── types ────────────────────────────────────────────────────────────────────

interface Props {
  initialOperators: SafeOperator[];
}

// ── component ─────────────────────────────────────────────────────────────────

export function OperatorsClient({ initialOperators }: Props) {
  const [operators, setOperators] = useState<SafeOperator[]>(initialOperators);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Create form state
  const [createName, setCreateName] = useState('');
  const [createUsername, setCreateUsername] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createPin, setCreatePin] = useState('');
  const [createActive, setCreateActive] = useState(true);
  const [createRole, setCreateRole] = useState<OperatorRole>('operator');
  const [createError, setCreateError] = useState('');
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  // Per-row reset password state
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetDone, setResetDone] = useState(false);

  // Per-row edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState<OperatorRole>('operator');
  const [editError, setEditError] = useState('');

  const today = new Date().toDateString();
  const activeToday = operators.filter(
    (op) => op.isActive && op.lastLoginAt && new Date(op.lastLoginAt).toDateString() === today
  ).length;
  const ordersToday = operators.reduce((sum, op) => {
    const todayActivity = (op.activityLog ?? []).filter(
      (a) => new Date(a.timestamp).toDateString() === today && a.targetType === 'order'
    ).length;
    return sum + todayActivity;
  }, 0);
  const avgOrders =
    operators.length > 0
      ? Math.round(operators.reduce((s, op) => s + (op.totalOrdersProcessed ?? 0), 0) / operators.length)
      : 0;

  function handleNameChange(name: string) {
    setCreateName(name);
    setCreateUsername(generateUsername(name));
  }

  function handleCreate() {
    if (!createName.trim() || !createUsername.trim() || !createPassword.trim()) {
      setCreateError('Nume, username și parola sunt obligatorii.');
      return;
    }
    setCreateError('');
    startTransition(async () => {
      const result = await createOperator({
        name: createName.trim(),
        username: createUsername.trim(),
        password: createPassword,
        pin: createPin.trim() || undefined,
        isActive: createActive,
        role: createRole,
      });
      if (!result.success) {
        setCreateError(result.error ?? 'Eroare necunoscută.');
        return;
      }
      setCreatedPassword(createPassword);
      setCreatedId(result.operatorId ?? null);
      const newOp: SafeOperator = {
        id: result.operatorId!,
        createdAt: new Date().toISOString(),
        name: createName.trim(),
        username: createUsername.trim().toLowerCase(),
        pin: createPin.trim() || undefined,
        role: createRole,
        isActive: createActive,
        totalOrdersProcessed: 0,
        totalReservationsProcessed: 0,
        lastLoginAt: '',
        lastActivityAt: '',
        loginHistory: [],
        activityLog: [],
      };
      setOperators((prev) => [newOp, ...prev]);
      setCreateName('');
      setCreateUsername('');
      setCreatePassword(generatePassword());
      setCreatePin('');
      setCreateActive(true);
      setCreateRole('operator');
    });
  }

  function startEdit(op: SafeOperator) {
    setEditId(op.id);
    setEditName(op.name);
    setEditUsername(op.username);
    setEditRole((op.role as OperatorRole) ?? 'operator');
    setEditError('');
  }

  function handleEdit(id: string) {
    if (!editName.trim() || !editUsername.trim()) {
      setEditError('Nume și username sunt obligatorii.');
      return;
    }
    setEditError('');
    startTransition(async () => {
      const result = await updateOperator(id, { name: editName.trim(), username: editUsername.trim(), role: editRole });
      if (!result.success) { setEditError(result.error ?? 'Eroare.'); return; }
      setOperators((prev) =>
        prev.map((op) => op.id === id ? { ...op, name: editName.trim(), username: editUsername.trim().toLowerCase(), role: editRole } : op)
      );
      setEditId(null);
    });
  }

  function handleResetPassword(id: string) {
    if (!resetPassword.trim()) { setResetError('Parola nu poate fi goală.'); return; }
    setResetError('');
    startTransition(async () => {
      const result = await resetOperatorPassword(id, resetPassword);
      if (!result.success) { setResetError(result.error ?? 'Eroare.'); return; }
      setResetDone(true);
    });
  }

  function handleToggleActive(id: string, current: boolean) {
    startTransition(async () => {
      const result = await toggleOperatorActive(id, !current);
      if (result.success) {
        setOperators((prev) => prev.map((op) => op.id === id ? { ...op, isActive: !current } : op));
      }
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Ești sigur că vrei să ștergi operatorul "${name}"? Acțiunea este ireversibilă.`)) return;
    startTransition(async () => {
      const result = await deleteOperator(id);
      if (result.success) {
        setOperators((prev) => prev.filter((op) => op.id !== id));
        if (expandedId === id) setExpandedId(null);
      }
    });
  }

  const cardStyle: React.CSSProperties = { background: '#1A1A1A', border: '1px solid #2E2E2E', borderRadius: 8, padding: '16px 20px' };
  const inputStyle: React.CSSProperties = { background: '#0F0F0F', border: '1px solid #2E2E2E', color: '#F0EDE6', borderRadius: 6, padding: '8px 12px', fontSize: 14, width: '100%', outline: 'none' };
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };
  const btnGold: React.CSSProperties = { background: '#C9A84C', color: '#0F0F0F', fontWeight: 700, border: 'none', borderRadius: 6, padding: '8px 18px', cursor: 'pointer', fontSize: 14 };
  const btnGhost: React.CSSProperties = { background: 'transparent', color: '#9A9490', border: '1px solid #2E2E2E', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13 };
  const btnRed: React.CSSProperties = { background: 'transparent', color: '#EF4444', border: '1px solid #EF4444', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Total operatori', value: operators.length },
          { label: 'Activi azi', value: activeToday },
          { label: 'Comenzi azi', value: ordersToday },
          { label: 'Medie/operator', value: avgOrders },
        ].map((s) => (
          <div key={s.label} style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#C9A84C' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#9A9490', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Header + create button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#9A9490', fontSize: 14 }}>{operators.length} operatori</span>
        <button style={btnGold} onClick={() => { setShowCreate(true); setCreatedPassword(null); setCreatePassword(generatePassword()); }}>
          + Adaugă Operator
        </button>
      </div>

      {/* Create dialog */}
      {showCreate && (
        <div style={{ ...cardStyle, border: '1px solid #C9A84C33' }}>
          {createdPassword ? (
            <div>
              <p style={{ color: '#4ADE80', fontWeight: 600, marginBottom: 8 }}>✓ Operator creat cu succes!</p>
              <p style={{ color: '#9A9490', fontSize: 13, marginBottom: 4 }}>
                Salvează această parolă acum — nu va mai fi afișată niciodată:
              </p>
              <code style={{ display: 'block', background: '#0F0F0F', padding: '10px 14px', borderRadius: 6, color: '#C9A84C', fontSize: 15, letterSpacing: 1, marginBottom: 14 }}>
                {createdPassword}
              </code>
              <button style={btnGhost} onClick={() => { setShowCreate(false); setCreatedPassword(null); setCreatedId(null); }}>
                Închide
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ color: '#F0EDE6', fontWeight: 600, marginBottom: 4 }}>Operator nou</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ color: '#9A9490', fontSize: 13 }}>
                  Nume complet *
                  <input style={{ ...inputStyle, marginTop: 4 }} value={createName} onChange={(e) => handleNameChange(e.target.value)} placeholder="Ion Popescu" />
                </label>
                <label style={{ color: '#9A9490', fontSize: 13 }}>
                  Username *
                  <input style={{ ...inputStyle, marginTop: 4 }} value={createUsername} onChange={(e) => setCreateUsername(e.target.value)} placeholder="ion.popescu" />
                </label>
                <label style={{ color: '#9A9490', fontSize: 13 }}>
                  Parolă *
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <input style={{ ...inputStyle, flex: 1 }} value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} />
                    <button type="button" style={{ ...btnGhost, whiteSpace: 'nowrap' }} onClick={() => setCreatePassword(generatePassword())}>↺</button>
                  </div>
                </label>
                <label style={{ color: '#9A9490', fontSize: 13 }}>
                  PIN (opțional)
                  <input style={{ ...inputStyle, marginTop: 4 }} value={createPin} onChange={(e) => setCreatePin(e.target.value)} placeholder="4-6 cifre" maxLength={6} />
                </label>
                <label style={{ color: '#9A9490', fontSize: 13 }}>
                  Rol *
                  <select
                    style={{ ...selectStyle, marginTop: 4 }}
                    value={createRole}
                    onChange={(e) => setCreateRole(e.target.value as OperatorRole)}
                  >
                    <option value="operator">Operator 📦 — Gestionează comenzi și rezervări</option>
                    <option value="manager">Manager 🔧 — Editează conținut, fără ștergere</option>
                  </select>
                  <span style={{ display: 'block', fontSize: 12, color: '#9A9490', marginTop: 5, lineHeight: 1.4 }}>
                    {createRole === 'operator'
                      ? 'Poate vizualiza și gestiona comenzi, rezervări. Nu poate edita conținut sau șterge.'
                      : 'Poate edita meniu, noutăți, evenimente. Nu poate șterge conținut sau accesa setările.'}
                  </span>
                </label>
              </div>
              <p style={{ fontSize: 12, color: '#9A9490', marginTop: 2, lineHeight: 1.5 }}>
                ℹ️ Contul de Administrator este configurat direct în setările serverului și nu poate fi creat din interfață.
              </p>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9A9490', fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={createActive} onChange={(e) => setCreateActive(e.target.checked)} />
                Cont activ
              </label>
              {createError && <p style={{ color: '#EF4444', fontSize: 13 }}>{createError}</p>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={btnGold} onClick={handleCreate} disabled={isPending}>
                  {isPending ? 'Se salvează...' : 'Creează Operator'}
                </button>
                <button style={btnGhost} onClick={() => setShowCreate(false)}>Anulează</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Operators table */}
      <div style={cardStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2E2E2E' }}>
              {['Operator', 'Username', 'Rol', 'Status', 'Comenzi', 'Ultimul login', 'Acțiuni'].map((h) => (
                <th key={h} style={{ textAlign: 'left', color: '#9A9490', fontSize: 12, fontWeight: 500, padding: '8px 10px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {operators.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#9A9490', padding: '24px 0', fontSize: 14 }}>
                  Niciun operator creat.
                </td>
              </tr>
            )}
            {operators.map((op) => (
              <>
                <tr
                  key={op.id}
                  onClick={() => setExpandedId(expandedId === op.id ? null : op.id)}
                  style={{ borderBottom: '1px solid #2E2E2E', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#1F1F1F')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 10px', color: '#F0EDE6', fontWeight: 500 }}>{op.name}</td>
                  <td style={{ padding: '12px 10px', color: '#9A9490', fontSize: 13 }}>{op.username}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={ROLE_STYLE[(op.role as OperatorRole) ?? 'operator']}>
                      {ROLE_LABELS[(op.role as OperatorRole) ?? 'operator']}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{ background: op.isActive ? '#4ADE8020' : '#EF444420', color: op.isActive ? '#4ADE80' : '#EF4444', borderRadius: 999, padding: '2px 10px', fontSize: 12 }}>
                      {op.isActive ? 'Activ' : 'Inactiv'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', color: '#F0EDE6' }}>{op.totalOrdersProcessed ?? 0}</td>
                  <td style={{ padding: '12px 10px', color: '#9A9490', fontSize: 13 }}>{formatDate(op.lastLoginAt)}</td>
                  <td style={{ padding: '12px 10px' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={btnGhost} onClick={() => startEdit(op)}>Editează</button>
                      <button
                        style={op.isActive ? btnGhost : { ...btnGhost, color: '#C9A84C', borderColor: '#C9A84C55' }}
                        onClick={() => handleToggleActive(op.id, op.isActive)}
                        disabled={isPending}
                      >
                        {op.isActive ? 'Dezactivează' : 'Activează'}
                      </button>
                      <button style={btnRed} onClick={() => handleDelete(op.id, op.name)} disabled={isPending}>
                        Șterge
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Edit inline row */}
                {editId === op.id && (
                  <tr key={`edit-${op.id}`} style={{ background: '#161616' }}>
                    <td colSpan={7} style={{ padding: '14px 16px' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <label style={{ color: '#9A9490', fontSize: 13 }}>
                          Nume
                          <input style={{ ...inputStyle, marginTop: 4, width: 200 }} value={editName} onChange={(e) => setEditName(e.target.value)} />
                        </label>
                        <label style={{ color: '#9A9490', fontSize: 13 }}>
                          Username
                          <input style={{ ...inputStyle, marginTop: 4, width: 180 }} value={editUsername} onChange={(e) => setEditUsername(e.target.value)} />
                        </label>
                        <label style={{ color: '#9A9490', fontSize: 13 }}>
                          Rol
                          <select
                            style={{ ...selectStyle, marginTop: 4, width: 160 }}
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as OperatorRole)}
                          >
                            <option value="operator">Operator 📦</option>
                            <option value="manager">Manager 🔧</option>
                          </select>
                          <span style={{ display: 'block', fontSize: 11, color: '#9A9490', marginTop: 4, lineHeight: 1.4 }}>
                            {editRole === 'operator'
                              ? 'Acces comenzi & rezervări'
                              : 'Acces extins — meniu, noutăți, media'}
                          </span>
                        </label>
                        <button style={btnGold} onClick={() => handleEdit(op.id)} disabled={isPending}>Salvează</button>
                        <button style={btnGhost} onClick={() => setEditId(null)}>Anulează</button>
                        {editError && <span style={{ color: '#EF4444', fontSize: 13 }}>{editError}</span>}
                      </div>
                    </td>
                  </tr>
                )}

                {/* Expanded row */}
                {expandedId === op.id && editId !== op.id && (
                  <tr key={`exp-${op.id}`} style={{ background: '#161616' }}>
                    <td colSpan={7} style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                        {/* Stats */}
                        <div>
                          <p style={{ color: '#9A9490', fontSize: 12, marginBottom: 10, fontWeight: 600 }}>STATISTICI</p>
                          {[
                            ['Rol', ROLE_LABELS[(op.role as OperatorRole) ?? 'operator']],
                            ['Comenzi procesate', op.totalOrdersProcessed ?? 0],
                            ['Rezervări procesate', op.totalReservationsProcessed ?? 0],
                            ['Creat la', formatDate(op.createdAt)],
                            ['Ultima activitate', formatDate(op.lastActivityAt)],
                          ].map(([k, v]) => (
                            <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ color: '#9A9490', fontSize: 13 }}>{k}</span>
                              <span style={{ color: '#F0EDE6', fontSize: 13 }}>{v}</span>
                            </div>
                          ))}
                        </div>

                        {/* Last 10 activities */}
                        <div>
                          <p style={{ color: '#9A9490', fontSize: 12, marginBottom: 10, fontWeight: 600 }}>ACTIVITATE RECENTĂ</p>
                          {(op.activityLog ?? []).slice(0, 10).length === 0 && (
                            <p style={{ color: '#9A9490', fontSize: 13 }}>Nicio activitate.</p>
                          )}
                          {(op.activityLog ?? []).slice(0, 10).map((a, i) => (
                            <div key={i} style={{ marginBottom: 5, fontSize: 13 }}>
                              <span style={{ color: '#9A9490' }}>{new Date(a.timestamp).toLocaleString('ro-RO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                              {' — '}
                              <span style={{ color: '#F0EDE6' }}>{STATUS_MAP[a.action] ?? a.action}</span>
                              {' '}
                              <span style={{ color: '#C9A84C', fontSize: 12 }}>{a.targetType === 'order' ? '📦' : '📅'} {a.targetId.slice(-6)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Reset password + last logins */}
                        <div>
                          <p style={{ color: '#9A9490', fontSize: 12, marginBottom: 10, fontWeight: 600 }}>RESETARE PAROLĂ</p>
                          {resetId === op.id && resetDone ? (
                            <div>
                              <p style={{ color: '#4ADE80', fontSize: 13, marginBottom: 8 }}>✓ Parola a fost resetată.</p>
                              <p style={{ color: '#9A9490', fontSize: 12, marginBottom: 4 }}>Noua parolă (salvează acum):</p>
                              <code style={{ display: 'block', background: '#0F0F0F', padding: '8px 12px', borderRadius: 6, color: '#C9A84C', fontSize: 14, marginBottom: 10 }}>{resetPassword}</code>
                              <button style={btnGhost} onClick={() => { setResetId(null); setResetDone(false); setResetPassword(''); }}>Închide</button>
                            </div>
                          ) : resetId === op.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <input style={{ ...inputStyle, flex: 1 }} placeholder="Parolă nouă" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} />
                                <button type="button" style={btnGhost} onClick={() => setResetPassword(generatePassword())}>↺</button>
                              </div>
                              {resetError && <p style={{ color: '#EF4444', fontSize: 12 }}>{resetError}</p>}
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button style={btnGold} onClick={() => handleResetPassword(op.id)} disabled={isPending}>Resetează</button>
                                <button style={btnGhost} onClick={() => { setResetId(null); setResetError(''); }}>Anulează</button>
                              </div>
                            </div>
                          ) : (
                            <button style={btnGhost} onClick={() => { setResetId(op.id); setResetPassword(generatePassword()); setResetDone(false); setResetError(''); }}>
                              Resetează Parola
                            </button>
                          )}

                          <p style={{ color: '#9A9490', fontSize: 12, marginTop: 16, marginBottom: 8, fontWeight: 600 }}>ULTIMELE LOGĂRI</p>
                          {(op.loginHistory ?? []).slice(0, 5).length === 0 && (
                            <p style={{ color: '#9A9490', fontSize: 13 }}>Nicio logare.</p>
                          )}
                          {(op.loginHistory ?? []).slice(0, 5).map((l, i) => (
                            <div key={i} style={{ fontSize: 13, color: '#9A9490', marginBottom: 4 }}>
                              {formatDate(l.loginAt)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
