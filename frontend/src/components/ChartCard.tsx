import { ReactNode } from 'react';

export default function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel p-5">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <div className="mt-4 h-72">{children}</div>
    </section>
  );
}
