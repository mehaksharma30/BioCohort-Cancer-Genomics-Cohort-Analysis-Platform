import { ArrowRight, FlaskConical, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, formatDate, friendlyMessage } from '../api/client';
import DataPill from '../components/DataPill';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import { Cohort, CohortFilters, Project } from '../types';

type FormState = {
  name: string;
  description: string;
  project_id: string;
  primary_site: string;
  gender: string;
  vital_status: string;
  min_age: string;
  max_age: string;
};

export default function CohortBuilder() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: 'Breast Cancer RNA Cohort',
    description: 'TCGA cases filtered for analysis-ready metadata.',
    project_id: 'TCGA-BRCA',
    primary_site: '',
    gender: '',
    vital_status: '',
    min_age: '',
    max_age: ''
  });

  const load = async () => {
    setError('');
    try {
      const [projectRes, cohortRes] = await Promise.all([api.get<Project[]>('/projects'), api.get<Cohort[]>('/cohorts')]);
      setProjects(projectRes.data ?? []);
      setCohorts(cohortRes.data ?? []);
    } catch (err: any) {
      setError(friendlyMessage(err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filters = useMemo<CohortFilters>(() => ({
    project_id: form.project_id || undefined,
    primary_site: form.primary_site || undefined,
    gender: form.gender || undefined,
    vital_status: form.vital_status || undefined,
    min_age: form.min_age ? Number(form.min_age) : undefined,
    max_age: form.max_age ? Number(form.max_age) : undefined
  }), [form]);

  const filterEntries = Object.entries(filters).filter(([, value]) => value !== undefined && value !== '');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await api.post<Cohort>('/cohorts', { name: form.name, description: form.description, filters });
      navigate(`/cohorts/${res.data.cohort_id}`);
    } catch (err: any) {
      setError(friendlyMessage(err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading cohort builder" />;

  return (
    <div className="space-y-7">
      <PageHeader
        title="Cohort Builder"
        subtitle="Define research cohorts using TCGA project, primary site, demographic, clinical status, and age filters."
        badge="Analysis-ready cohort definition"
      />
      {error && <ErrorState message={error} onRetry={load} />}

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <form onSubmit={submit} className="panel p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700"><Search size={22} /></div>
            <div>
              <h2 className="font-semibold text-slate-950">Query Criteria</h2>
              <p className="text-sm text-slate-500">Select metadata filters and save a reproducible cohort definition.</p>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Cohort name" helper="Use a descriptive research cohort name." value={form.name} onChange={(name) => setForm({ ...form, name })} className="sm:col-span-2" />
            <Field label="Description" helper="Short purpose or downstream analysis context." value={form.description} onChange={(description) => setForm({ ...form, description })} className="sm:col-span-2" />
            <label className="text-sm font-semibold text-slate-700">TCGA project
              <select className="field" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
                <option value="">Any project</option>
                {projects.map((p) => <option key={p.project_id} value={p.project_id}>{p.project_id} - {p.primary_site}</option>)}
              </select>
              <span className="mt-1 block text-xs font-normal text-slate-500">Loaded from the project metadata table.</span>
            </label>
            <Field label="Primary site" helper="Example: Breast, Colon, Brain." value={form.primary_site} onChange={(primary_site) => setForm({ ...form, primary_site })} placeholder="Breast" />
            <Select label="Gender" value={form.gender} options={[['', 'Any'], ['female', 'female'], ['male', 'male']]} onChange={(gender) => setForm({ ...form, gender })} />
            <Select label="Vital status" value={form.vital_status} options={[['', 'Any'], ['Alive', 'Alive'], ['Dead', 'Dead']]} onChange={(vital_status) => setForm({ ...form, vital_status })} />
            <Field label="Minimum age" type="number" helper="Age at diagnosis lower bound." value={form.min_age} onChange={(min_age) => setForm({ ...form, min_age })} />
            <Field label="Maximum age" type="number" helper="Age at diagnosis upper bound." value={form.max_age} onChange={(max_age) => setForm({ ...form, max_age })} />
          </div>
          <div className="mt-6 flex justify-end">
            <button disabled={saving || !form.name.trim()} className="btn-primary">
              <FlaskConical size={16} /> {saving ? 'Creating cohort' : 'Create Cohort'}
            </button>
          </div>
        </form>

        <aside className="space-y-5">
          <div className="panel p-6">
            <h2 className="font-semibold text-slate-950">Query Preview</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Filters are stored as JSONB and used to materialize matching case identifiers.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {filterEntries.length ? filterEntries.map(([key, value]) => <DataPill key={key} label={key} value={String(value)} />) : <DataPill label="filters" value="Any available case" />}
            </div>
          </div>

          <div className="panel p-6">
            <h2 className="font-semibold text-slate-950">Existing Cohorts</h2>
            <p className="mt-2 text-sm text-slate-500">Open a saved cohort to inspect distributions and quality reports.</p>
            <div className="mt-5 space-y-3">
              {cohorts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
                  No cohorts yet. Create your first analysis-ready cohort from public TCGA/GDC metadata.
                </div>
              ) : cohorts.slice(0, 6).map((cohort) => (
                <Link key={cohort.cohort_id} to={`/cohorts/${cohort.cohort_id}`} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50">
                  <div>
                    <div className="font-semibold text-slate-950">{cohort.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{cohort.case_count} cases • {formatDate(cohort.created_at)}</div>
                  </div>
                  <ArrowRight size={16} className="text-slate-400" />
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, helper, value, onChange, type = 'text', placeholder, className = '' }: { label: string; helper?: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; className?: string }) {
  return (
    <label className={`text-sm font-semibold text-slate-700 ${className}`}>
      {label}
      <input className="field" type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {helper && <span className="mt-1 block text-xs font-normal text-slate-500">{helper}</span>}
    </label>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: Array<[string, string]>; onChange: (v: string) => void }) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([value, label]) => <option key={label} value={value}>{label}</option>)}
      </select>
    </label>
  );
}
