import { Activity, Database, FlaskConical, LayoutDashboard } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const link = 'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium';

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <div className="text-xl font-semibold tracking-tight text-slate-950">BioCohort</div>
          <div className="text-sm text-slate-500">Cancer genomics cohort analysis platform</div>
        </div>
        <nav className="flex flex-wrap gap-2">
          <NavLink className={({ isActive }) => `${link} ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`} to="/">
            <LayoutDashboard size={16} /> Dashboard
          </NavLink>
          <NavLink className={({ isActive }) => `${link} ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`} to="/ingestion">
            <Database size={16} /> Ingestion
          </NavLink>
          <NavLink className={({ isActive }) => `${link} ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`} to="/cohorts/new">
            <FlaskConical size={16} /> Cohort Builder
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
