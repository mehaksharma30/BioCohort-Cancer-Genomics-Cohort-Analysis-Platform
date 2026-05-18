export default function DataPill({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
      <span className="text-slate-500">{label}</span>
      <span>{value}</span>
    </span>
  );
}
