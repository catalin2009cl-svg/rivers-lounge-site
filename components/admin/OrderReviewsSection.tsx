'use client';

const STAR_LABELS = ['', 'Dezamăgitor', 'Slab', 'Acceptabil', 'Bun', 'Excelent'];

interface OrderReview {
  id: string;
  orderId: string;
  rating: number;
  comment: string | null;
  isLowRating: boolean;
  adminAlerted: boolean;
  createdAt: string;
  user: { id: string; name: string; email: string };
  order: { id: string; total: number };
}

export function OrderReviewsSection({ reviews }: { reviews: OrderReview[] }) {
  if (reviews.length === 0) {
    return (
      <div className="p-6 lg:p-8 pb-0">
        <h2 className="text-lg font-semibold text-[#F0EDE6] mb-2">Recenzii Comenzi</h2>
        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-8 text-center mb-6">
          <p className="text-[#9A9490] text-sm">Nicio recenzie de comandă primită încă.</p>
          <p className="text-[#666] text-xs mt-1">Emailurile se trimit automat la 2h după statusul &ldquo;livrata&rdquo;.</p>
        </div>
      </div>
    );
  }

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="p-6 lg:p-8 pb-0">
      <h2 className="text-lg font-semibold text-[#F0EDE6] mb-4">Recenzii Comenzi</h2>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Rating mediu', value: avg.toFixed(1), color: '#C9A84C' },
          { label: 'Total', value: String(reviews.length), color: '#F0EDE6' },
          { label: 'Pozitive (4-5★)', value: String(reviews.filter((r) => r.rating >= 4).length), color: '#4ADE80' },
          { label: 'Negative (1-2★)', value: String(reviews.filter((r) => r.isLowRating).length), color: '#F87171' },
        ].map((s) => (
          <div key={s.label} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-3">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-[#9A9490] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Distribution */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 mb-4">
        <h3 className="text-xs font-semibold text-[#9A9490] uppercase tracking-wider mb-3">Distribuție</h3>
        <div className="space-y-1.5">
          {distribution.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-2">
              <span className="text-[11px] text-[#9A9490] w-4">{star}★</span>
              <div className="flex-1 h-1.5 bg-[#2E2E2E] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(count / reviews.length) * 100}%`,
                    background: star >= 4 ? '#4ADE80' : star === 3 ? '#C9A84C' : '#F87171',
                  }}
                />
              </div>
              <span className="text-[11px] text-[#9A9490] w-5">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-3 mb-8">
        {reviews.map((r) => (
          <div
            key={r.id}
            className="bg-[#1a1a1a] border rounded-xl p-4"
            style={{ borderColor: r.isLowRating ? 'rgba(248,113,113,0.3)' : 'rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#F0EDE6]">{r.user.name}</span>
                  {r.isLowRating && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#F87171]/10 text-[#F87171]">
                      ALERTĂ
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#9A9490]">{r.user.email}</p>
              </div>
              <div className="text-right">
                <p
                  className="text-base font-bold"
                  style={{ color: r.rating >= 4 ? '#4ADE80' : r.rating === 3 ? '#C9A84C' : '#F87171' }}
                >
                  {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                </p>
                <p className="text-xs text-[#9A9490]">{STAR_LABELS[r.rating]}</p>
              </div>
            </div>

            {r.comment && (
              <p className="mt-2 text-sm text-[#ccc] italic border-t border-white/5 pt-2">
                &ldquo;{r.comment}&rdquo;
              </p>
            )}

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
              <p className="text-xs text-[#666]">
                Comandă <span className="font-mono text-[#9A9490]">#{r.orderId.slice(-8).toUpperCase()}</span>
                {' · '}{r.order.total.toFixed(0)} RON
              </p>
              <p className="text-xs text-[#666]">
                {new Date(r.createdAt).toLocaleDateString('ro-RO', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
