export default function LoadingState({ label = 'Loading data' }: { label?: string }) {
  return (
    <div className="panel p-6">
      <div className="mb-4 text-sm font-semibold text-slate-600">{label}</div>
      <div className="space-y-3">
        <div className="h-4 w-1/3 animate-pulse rounded-full bg-slate-200" />
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-200" />
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}
