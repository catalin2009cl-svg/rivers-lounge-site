import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Rapoarte Săptămânale | Admin Rivers Lounge' };

export default async function RapoartePage() {
  await requireAuth();

  const reports = await prisma.weeklyReport.findMany({
    orderBy: { weekStart: 'desc' },
    take: 52,
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold text-[#F0EDE6]">Rapoarte Săptămânale</h1>
        <span className="text-xs text-[#9A9490]">Trimise automat în fiecare luni la 08:00</span>
      </div>

      {reports.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-12 text-center">
          <p className="text-[#9A9490] text-sm mb-1">Niciun raport generat încă.</p>
          <p className="text-[#666] text-xs">Primul raport va fi generat luni dimineață.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const weekLabel = `${new Date(r.weekStart).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })} – ${new Date(r.weekEnd).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })}`;
            return (
              <div key={r.id} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-[#F0EDE6] mb-1">{weekLabel}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-[#9A9490]">{r.totalOrders} comenzi</span>
                      <span className="text-xs text-[#9A9490]">·</span>
                      <span className="text-xs text-[#C9A84C] font-semibold">{r.totalRevenue.toFixed(0)} RON</span>
                      <span className="text-xs text-[#9A9490]">·</span>
                      <span className="text-xs text-[#9A9490]">Avg {r.avgOrderValue.toFixed(0)} RON</span>
                      <span className="text-xs text-[#9A9490]">·</span>
                      <span className="text-xs text-[#4ADE80]">{r.completedOrders} livrate</span>
                      {r.cancelledOrders > 0 && (
                        <>
                          <span className="text-xs text-[#9A9490]">·</span>
                          <span className="text-xs text-[#F87171]">{r.cancelledOrders} anulate</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-[#9A9490]">
                        {r.emailSentAt
                          ? `Email trimis ${new Date(r.emailSentAt).toLocaleDateString('ro-RO')}`
                          : 'Email netrimis'}
                      </p>
                      {r.pdfUrl && (
                        <a
                          href={r.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#C9A84C] hover:underline"
                        >
                          Descarcă PDF →
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Top products preview */}
                {Array.isArray(r.topProducts) && (r.topProducts as Array<{ name: string; count: number }>).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-[10px] text-[#666] uppercase tracking-wider mb-1.5">Top produse</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(r.topProducts as Array<{ name: string; count: number }>).slice(0, 5).map((p, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-2 py-0.5 rounded-md"
                          style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}
                        >
                          {p.name} ×{p.count}
                        </span>
                      ))}
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
