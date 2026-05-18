import { Activity, Database, FlaskConical, LayoutDashboard } from 'lucide-react';
import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/ingestion', label: 'Ingestion', icon: Database },
  { to: '/cohorts/new', label: 'Cohorts', icon: FlaskConical }
];

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm shadow-blue-200">
              <Activity size={22} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xl font-semibold tracking-tight text-slate-950">BioCohort</span>
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-800">TCGA/GDC Demo Platform</span>
              </div>
              <p className="text-sm text-slate-500">Cancer genomics cohort analysis platform</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                    isActive ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
