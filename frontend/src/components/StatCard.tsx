import { LucideIcon } from 'lucide-react';

export default function StatCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: LucideIcon }) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
        </div>
        <div className="rounded-lg bg-blue-50 p-3 text-blue-700">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}
