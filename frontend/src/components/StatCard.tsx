import { LucideIcon } from 'lucide-react';

export default function StatCard({ label, value, helper, trend, icon: Icon }: { label: string; value: number | string; helper?: string; trend?: string; icon: LucideIcon }) {
  return (
    <div className="panel p-5 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
          {helper && <p className="mt-2 text-sm text-slate-500">{helper}</p>}
          {trend && <p className="mt-3 text-xs font-semibold text-cyan-700">{trend}</p>}
        </div>
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-700 ring-1 ring-blue-100">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}
