import { ReactNode } from 'react';

export default function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return (
    <div className="panel flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 h-12 w-12 rounded-2xl bg-slate-100 ring-1 ring-slate-200" />
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
