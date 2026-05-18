function color(score: number) {
  if (score >= 90) return { text: 'text-emerald-700', stroke: '#059669', bg: 'bg-emerald-50', label: 'Excellent' };
  if (score >= 70) return { text: 'text-amber-700', stroke: '#d97706', bg: 'bg-amber-50', label: 'Review recommended' };
  return { text: 'text-red-700', stroke: '#dc2626', bg: 'bg-red-50', label: 'Needs attention' };
}

export default function QualityScoreCard({ score, totalRecords }: { score: number; totalRecords: number }) {
  const c = color(score);
  const angle = Math.max(0, Math.min(100, score)) * 3.6;
  return (
    <div className="panel p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">Quality score</p>
          <div className="mt-2 flex items-end gap-2">
            <span className={`text-6xl font-semibold tracking-tight ${c.text}`}>{score.toFixed(1)}</span>
            <span className="pb-2 text-lg font-semibold text-slate-400">/100</span>
          </div>
          <p className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${c.bg} ${c.text}`}>{c.label}</p>
          <p className="mt-3 text-sm text-slate-500">{totalRecords} records evaluated for clinical metadata completeness.</p>
        </div>
        <div
          className="grid h-36 w-36 place-items-center rounded-full"
          style={{ background: `conic-gradient(${c.stroke} ${angle}deg, #e2e8f0 0deg)` }}
        >
          <div className="grid h-28 w-28 place-items-center rounded-full bg-white shadow-inner">
            <span className={`text-2xl font-semibold ${c.text}`}>{Math.round(score)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
