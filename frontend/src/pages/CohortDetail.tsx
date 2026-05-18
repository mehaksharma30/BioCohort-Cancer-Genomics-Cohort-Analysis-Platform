import { ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, toChartData } from '../api/client';
import ChartCard from '../components/ChartCard';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { Cohort, CohortSummary } from '../types';

export default function CohortDetail() {
  const { id } = useParams();
  const [cohort, setCohort] = useState<Cohort>();
  const [summary, setSummary] = useState<CohortSummary>();
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    Promise.all([api.get<Cohort>(`/cohorts/${id}`), api.get<CohortSummary>(`/cohorts/${id}/summary`)])
      .then(([c, s]) => { setCohort(c.data); setSummary(s.data); })
      .catch((err) => setError(err.message));
  }, [id]);

  const generate = async () => {
    setGenerating(true);
    try {
      await api.post(`/cohorts/${id}/quality-report`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (error) return <ErrorState message={error} />;
  if (!cohort || !summary) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold">{cohort.name}</h1>
          <p className="mt-1 text-sm text-slate-600">{cohort.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(cohort.filters).filter(([, v]) => v !== '' && v !== undefined).map(([k, v]) => <span key={k} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{k}: {String(v)}</span>)}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={generate} disabled={generating} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
            <ShieldCheck size={16} /> {generating ? 'Generating...' : 'Generate quality report'}
          </button>
          <Link className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100" to={`/cohorts/${id}/quality`}>View report</Link>
        </div>
      </div>
      <div className="panel p-5">
        <p className="text-sm font-medium text-slate-500">Total cases</p>
        <p className="mt-2 text-3xl font-semibold">{summary.total_cases}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Project distribution"><BarBlock data={toChartData(summary.project_distribution)} color="#2563eb" /></ChartCard>
        <ChartCard title="Gender distribution"><BarBlock data={toChartData(summary.gender_distribution)} color="#0f766e" /></ChartCard>
        <ChartCard title="Vital status"><BarBlock data={toChartData(summary.vital_status_distribution)} color="#7c3aed" /></ChartCard>
        <ChartCard title="Age buckets"><BarBlock data={summary.age_distribution.map((x) => ({ name: x.bucket, value: x.count }))} color="#ea580c" /></ChartCard>
        <ChartCard title="Sample types"><BarBlock data={toChartData(summary.sample_type_distribution)} color="#64748b" /></ChartCard>
      </div>
    </div>
  );
}

function BarBlock({ data, color }: { data: Array<{ name: string; value: number }>; color: string }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
