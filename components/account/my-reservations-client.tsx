'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import type { Reservation, ReservationNotification } from '@/lib/server-data';
import { markReservationNotificationsRead } from '@/lib/actions/reservations';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(dateStr: string, time?: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const datePart = d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });
  return time ? `${datePart}, ${time}` : datePart;
}

function fmtShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtNotifDate(iso: string) {
  return new Date(iso).toLocaleString('ro-RO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function isUpcoming(dateStr: string): boolean {
  return new Date(dateStr + 'T23:59:59') >= new Date();
}

type FilterTab = 'toate' | 'viitoare' | 'trecute' | 'anulate';

// ── Timeline ──────────────────────────────────────────────────────────────────

function Timeline({ reservation }: { reservation: Reservation }) {
  const steps = [
    {
      label: 'Solicitare trimisă',
      detail: fmtDateTime(reservation.createdAt),
      done: true,
    },
    {
      label: reservation.status === 'in-asteptare' ? 'În verificare...' : 'În verificare',
      detail: reservation.status !== 'noua' ? '' : null,
      done: reservation.status !== 'noua',
    },
    {
      label: reservation.status === 'refuzata' ? 'Rezervare anulată' : 'Confirmare',
      detail: reservation.status === 'acceptata' || reservation.status === 'refuzata'
        ? fmtDateTime(reservation.updatedAt)
        : null,
      done: reservation.status === 'acceptata' || reservation.status === 'refuzata',
      refused: reservation.status === 'refuzata',
    },
  ];

  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #2E2E2E', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flexShrink: 0, marginTop: 2 }}>
            {step.done ? (
              <span style={{ color: step.refused ? '#F87171' : '#C9A84C', fontSize: 14, lineHeight: 1 }}>●</span>
            ) : (
              <span style={{ color: '#3E3E3E', fontSize: 14, lineHeight: 1 }}>○</span>
            )}
          </div>
          <div>
            <p style={{ fontSize: 13, color: step.done ? '#F0EDE6' : '#9A9490', fontWeight: step.done ? 500 : 400 }}>
              {step.label}
            </p>
            {step.detail && (
              <p style={{ fontSize: 12, color: '#9A9490', marginTop: 1 }}>{step.detail}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Notification panel ────────────────────────────────────────────────────────

function NotificationPanel({ notifications }: { notifications: ReservationNotification[] }) {
  if (notifications.length === 0) return null;
  return (
    <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ fontSize: 11, color: '#9A9490', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Notificări
      </p>
      {notifications.map((n) => (
        <div
          key={n.id}
          style={{
            background: '#0F0F0F',
            borderLeft: '3px solid #2E2E2E',
            borderRadius: '0 8px 8px 0',
            padding: '10px 14px',
          }}
        >
          <p style={{ fontSize: 11, color: '#9A9490', marginBottom: 4 }}>
            {fmtNotifDate(n.createdAt)}
          </p>
          <p style={{ fontSize: 13, color: '#F0EDE6', lineHeight: 1.55 }}>
            🔔 {n.message}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

function ReservationCard({ reservation }: { reservation: Reservation }) {
  const [expanded, setExpanded] = useState(false);
  const [localNotifications, setLocalNotifications] = useState<ReservationNotification[]>(
    reservation.notifications ?? []
  );
  const [, startTransition] = useTransition();

  const unreadCount = localNotifications.filter((n) => !n.isRead).length;

  function handleToggle() {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    if (nextExpanded && unreadCount > 0) {
      setLocalNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      startTransition(async () => {
        await markReservationNotificationsRead(reservation.id);
      });
    }
  }

  const isPending  = reservation.status === 'noua' || reservation.status === 'in-asteptare';
  const isAccepted = reservation.status === 'acceptata';
  const isRefused  = reservation.status === 'refuzata';

  const cardBorder = isPending
    ? '1.5px dashed #C9A84C'
    : isAccepted
    ? '1.5px solid #4ADE8066'
    : isRefused
    ? '1.5px solid #F8717166'
    : '1px solid #2E2E2E';

  const headerBg = isPending
    ? 'rgba(201,168,76,0.08)'
    : isAccepted
    ? 'rgba(34,197,94,0.07)'
    : isRefused
    ? 'rgba(239,68,68,0.07)'
    : '#161616';

  return (
    <div style={{ background: '#1A1A1A', border: cardBorder, borderRadius: 12, overflow: 'hidden' }}>
      {/* Header bar */}
      <div style={{ background: headerBg, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        {isPending && (
          <>
            <style>{`@keyframes rl-pulse{0%,100%{opacity:1}50%{opacity:.3}}.rl-pulse-dot{animation:rl-pulse 1.5s ease-in-out infinite}`}</style>
            <span className="rl-pulse-dot" style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#C9A84C' }} />
          </>
        )}
        {isAccepted && <span>✅</span>}
        {isRefused && <span>❌</span>}
        <span style={{ color: '#F0EDE6', fontWeight: 600, fontSize: 14 }}>
          {isPending ? 'Rezervare în așteptare' : isAccepted ? 'Rezervare Confirmată' : 'Rezervare Anulată'}
        </span>
        {unreadCount > 0 && (
          <span style={{
            marginLeft: 'auto',
            background: '#3B82F6',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            borderRadius: 999,
            padding: '2px 8px',
            letterSpacing: '0.05em',
            flexShrink: 0,
          }}>
            {unreadCount} NOU
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px' }}>
        {/* Location + date */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#F0EDE6' }}>📍 {reservation.location}</span>
          <span style={{ fontSize: 13, color: '#C9A84C', fontWeight: 500 }}>
            {fmtDate(reservation.date, reservation.time)}
          </span>
        </div>

        {/* Details */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: '#9A9490' }}>👥 {reservation.guests} persoane</span>
          {reservation.eventType && (
            <span style={{ fontSize: 13, color: '#9A9490' }}>Tip: {reservation.eventType}</span>
          )}
          {reservation.name && (
            <span style={{ fontSize: 13, color: '#9A9490' }}>Nume: {reservation.name}</span>
          )}
        </div>

        {/* Status message */}
        {isPending && (
          <div style={{ background: '#0F0F0F', borderRadius: 8, padding: '10px 14px', marginBottom: 10 }}>
            <p style={{ fontSize: 13, color: '#9A9490', lineHeight: 1.5 }}>
              ⏳ Solicitarea ta a fost primită și este în curs de verificare. Te vom contacta în cel mai scurt timp
              {reservation.phone ? ` la: ${reservation.phone}` : ''}.
            </p>
          </div>
        )}
        {isAccepted && (
          <div style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 8, padding: '10px 14px', marginBottom: 10 }}>
            <p style={{ fontSize: 13, color: '#4ADE80', lineHeight: 1.5 }}>
              Rezervarea ta a fost confirmată! Te așteptăm cu drag.
            </p>
          </div>
        )}
        {isRefused && (
          <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '10px 14px', marginBottom: 10 }}>
            <p style={{ fontSize: 13, color: '#F87171', lineHeight: 1.5 }}>
              Ne pare rău, nu am putut onora această rezervare. Te rugăm să ne contactezi la{' '}
              <a href="tel:0734642449" style={{ color: '#F87171', fontWeight: 600 }}>0734 642 449</a>
              {' '}pentru mai multe detalii.
            </p>
          </div>
        )}

        {/* Plasată la */}
        <p style={{ fontSize: 12, color: '#9A9490', marginBottom: 10 }}>
          Plasată la: {fmtShortDate(reservation.createdAt)}
        </p>

        {/* Expand button */}
        <button
          onClick={handleToggle}
          style={{ background: 'transparent', border: 'none', color: '#9A9490', fontSize: 12, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          {expanded ? '▲ Ascunde detalii' : `▼ ${unreadCount > 0 ? 'Vezi notificări și timeline' : 'Vezi timeline'}`}
        </button>

        {/* Expandable section */}
        {expanded && (
          <>
            <NotificationPanel notifications={localNotifications} />
            <Timeline reservation={reservation} />
            {reservation.notes && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 11, color: '#9A9490', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Mențiuni</p>
                <p style={{ fontSize: 13, color: '#F0EDE6' }}>{reservation.notes}</p>
              </div>
            )}
            {reservation.observation && (
              <div style={{ marginTop: 10, background: '#0F0F0F', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#9A9490', fontStyle: 'italic' }}>
                📋 {reservation.observation}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  initialReservations: Reservation[];
}

export function MyReservationsClient({ initialReservations }: Props) {
  const [tab, setTab] = useState<FilterTab>('toate');

  const filtered = initialReservations.filter((r) => {
    if (tab === 'viitoare') return isUpcoming(r.date) && r.status !== 'refuzata';
    if (tab === 'trecute')  return !isUpcoming(r.date) && r.status !== 'refuzata';
    if (tab === 'anulate')  return r.status === 'refuzata';
    return true;
  });

  const upcomingCount = initialReservations.filter(
    (r) => isUpcoming(r.date) && r.status !== 'refuzata'
  ).length;

  const totalUnread = initialReservations.reduce(
    (sum, r) => sum + (r.notifications ?? []).filter((n) => !n.isRead).length,
    0
  );

  // ── Empty state ───────────────────────────────────────────────────────────

  if (initialReservations.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '72px 20px' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: 32,
        }}>
          📅
        </div>
        <h3 style={{ color: '#F0EDE6', fontFamily: 'serif', fontSize: 22, fontWeight: 600, marginBottom: 10 }}>
          Nicio rezervare încă
        </h3>
        <p style={{ color: '#9A9490', fontSize: 14, lineHeight: 1.65, maxWidth: 380, margin: '0 auto 28px' }}>
          Fie că planifici o cină specială sau un eveniment privat,
          te așteptăm cu drag la Rivers Lounge!
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/rezervari"
            style={{ background: '#C9A84C', color: '#0F0F0F', fontWeight: 700, padding: '11px 24px', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}
          >
            Rezervă o masă →
          </Link>
          <Link
            href="/contact"
            style={{ background: 'transparent', color: '#9A9490', border: '1px solid #2E2E2E', fontWeight: 600, padding: '11px 24px', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}
          >
            Contactează-ne
          </Link>
        </div>
      </div>
    );
  }

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'toate',    label: 'Toate' },
    { id: 'viitoare', label: `Viitoare${upcomingCount > 0 ? ` (${upcomingCount})` : ''}` },
    { id: 'trecute',  label: 'Trecute' },
    { id: 'anulate',  label: 'Anulate' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <p style={{ color: '#9A9490', fontSize: 14 }}>
            {initialReservations.length} rezervări · {upcomingCount} viitoare
          </p>
          {totalUnread > 0 && (
            <span style={{
              background: '#3B82F6', color: '#fff', fontSize: 11, fontWeight: 700,
              borderRadius: 999, padding: '2px 9px',
            }}>
              {totalUnread} noi
            </span>
          )}
        </div>
        <Link
          href="/rezervari"
          style={{ background: '#C9A84C', color: '#0F0F0F', fontWeight: 700, padding: '8px 18px', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}
        >
          ➕ Rezervare nouă
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #2E2E2E' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: 'transparent', border: 'none',
              borderBottom: tab === t.id ? '2px solid #C9A84C' : '2px solid transparent',
              color: tab === t.id ? '#F0EDE6' : '#9A9490',
              fontWeight: tab === t.id ? 600 : 400,
              fontSize: 14, padding: '9px 18px', cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#9A9490', padding: '32px 0', fontSize: 14 }}>
          Nicio rezervare în această categorie.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((r) => (
            <ReservationCard key={r.id} reservation={r} />
          ))}
        </div>
      )}
    </div>
  );
}
