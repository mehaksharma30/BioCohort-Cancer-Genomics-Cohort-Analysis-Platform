import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import ErrorState from '../components/ErrorState';
import { Cohort, CohortFilters, Project } from '../types';

export default function CohortBuilder() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: 'Breast Cancer RNA Cohort', description: 'TCGA cases filtered for analysis-ready metadata.', project_id: 'TCGA-BRCA', primary_site: '', gender: '', vital_status: '', min_age: '', max_age: '' });

  useEffect(() => { api.get<Project[]>('/projects').then((res) => setProjects(res.data ?? [])).catch((err) => setError(err.message)); }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const filters: CohortFilters = {
      project_id: form.project_id || undefined,
      primary_site: form.primary_site || undefined,
      gender: form.gender || undefined,
      vital_status: form.vital_status || undefined,
      min_age: form.min_age ? Number(form.min_age) : undefined,
      max_age: form.max_age ? Number(form.max_age) : undefined
    };
    try {
      const res = await api.post<Cohort>('/cohorts', { name: form.name, description: form.description, filters });
      navigate(`/cohorts/${res.data.cohort_id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Cohort Builder</h1>
        <p className="mt-1 text-sm text-slate-600">Create a reproducible research cohort from structured public metadata filters.</p>
      </div>
      {error && <ErrorState message={error} />}
      <div className="panel grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} className="sm:col-span-2" />
        <Field label="Description" value={form.description} onChange={(description) => setForm({ ...form, description })} className="sm:col-span-2" />
        <label className="text-sm font-medium text-slate-700">Project
          <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
            <option value="">Any project</option>
            {projects.map((p) => <option key={p.project_id} value={p.project_id}>{p.project_id} - {p.primary_site}</option>)}
          </select>
        </label>
        <Field label="Primary site" value={form.primary_site} onChange={(primary_site) => setForm({ ...form, primary_site })} placeholder="Breast" />
        <Select label="Gender" value={form.gender} options={['', 'female', 'male']} onChange={(gender) => setForm({ ...form, gender })} />
        <Select label="Vital status" value={form.vital_status} options={['', 'Alive', 'Dead']} onChange={(vital_status) => setForm({ ...form, vital_status })} />
        <Field label="Minimum age" type="number" value={form.min_age} onChange={(min_age) => setForm({ ...form, min_age })} />
        <Field label="Maximum age" type="number" value={form.max_age} onChange={(max_age) => setForm({ ...form, max_age })} />
      </div>
      <button disabled={saving} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">{saving ? 'Creating...' : 'Create cohort'}</button>
    </form>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, className = '' }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; className?: string }) {
  return <label className={`text-sm font-medium text-slate-700 ${className}`}>{label}<input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></label>;
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return <label className="text-sm font-medium text-slate-700">{label}<select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o || 'any'} value={o}>{o || 'Any'}</option>)}</select></label>;
}
