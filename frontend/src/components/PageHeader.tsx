import { ReactNode } from 'react';

export default function PageHeader({ title, subtitle, badge, action }: { title: string; subtitle: string; badge?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div className="max-w-4xl">
        {badge && <div className="mb-3 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{badge}</div>}
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">{subtitle}</p>
      </div>
      {action && <div className="flex flex-wrap gap-3">{action}</div>}
    </div>
  );
}
