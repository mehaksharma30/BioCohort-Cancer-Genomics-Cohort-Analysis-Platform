export default function StatusBadge({ status }: { status?: string }) {
  const normalized = status ?? 'UNKNOWN';
  const styles: Record<string, string> = {
    RUNNING: 'border-blue-200 bg-blue-50 text-blue-700',
    COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    COMPLETED_WITH_FALLBACK: 'border-amber-200 bg-amber-50 text-amber-800',
    FAILED: 'border-red-200 bg-red-50 text-red-700'
  };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[normalized] ?? 'border-slate-200 bg-slate-50 text-slate-700'}`}>
      {normalized.replace(/_/g, ' ')}
    </span>
  );
}
