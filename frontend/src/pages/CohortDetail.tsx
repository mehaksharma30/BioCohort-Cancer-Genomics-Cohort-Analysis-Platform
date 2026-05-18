import { Activity, ArrowRight, Database, Dna, ShieldCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, friendlyMessage, toChartData } from '../api/client';
import ChartCard from '../components/ChartCard';
import DataPill from '../components/DataPill';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { Cohort, CohortSummary } from '../types';

export default function CohortDetail() {
  const { id } = useParams();
  const [cohort, setCohort] = useState<Cohort>();
  const [summary, setSummary] = useState<CohortSummary>();
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    setError('');
    try {
      const [cohortRes, summaryRes] = await Promise.all([api.get<Cohort>(`/cohorts/${id}`), api.get<CohortSummary>(`/cohorts/${id}/summary`)]);
      setCohort(cohortRes.data);
      setSummary(summaryRes.data);
    } catch (err: any) {
      setError(friendlyMessage(err.message));
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const generate = async () => {
    setGenerating(true);
    setError('');
    try {
      await api.post(`/cohorts/${id}/quality-report`);
    } catch (err: any) {
      setError(friendlyMessage(err.message));
    } finally {
      setGenerating(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!cohort || !summary) return <LoadingState label="Loading cohort analytics" />;

  const filters = Object.entries(cohort.filters).filter(([, value]) => value !== '' && value !== undefined);

  return (
    <div className="space-y-7">
      <PageHeader
        title={cohort.name}
        subtitle={cohort.description || 'Analysis-ready cohort generated from public TCGA/GDC metadata filters.'}
        badge={`${summary.total_cases} cases`}
        action={
          <>
            <button onClick={generate} disabled={generating} className="btn-primary">
              <ShieldCheck size={16} /> {generating ? 'Generating report' : 'Generate Quality Report'}
            </button>
            <Link className="btn-secondary" to={`/cohorts/${id}/quality`}>View Quality Report <ArrowRight size={16} /></Link>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        {filters.length ? filters.map(([key, value]) => <DataPill key={key} label={key} value={String(value)} />) : <DataPill label="filters" value="All cases" />}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Cohort Cases" value={summary.total_cases} helper="Matched case identifiers" />
        <StatCard icon={Dna} label="Projects" value={Object.keys(summary.project_distribution ?? {}).length} helper="Project coverage" />
        <StatCard icon={Database} label="Sample Types" value={Object.keys(summary.sample_type_distribution ?? {}).length} helper="Sample-level metadata" />
        <StatCard icon={Activity} label="Vital Labels" value={Object.keys(summary.vital_status_distribution ?? {}).length} helper="Clinical status values" />
      </div>

      {summary.total_cases === 0 ? (
        <EmptyState title="No cases matched this cohort" message="Adjust the query filters in the Cohort Builder to create a cohort with matching public metadata." />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartCard title="Gender Distribution" subtitle="Demographic metadata values"><BarBlock data={toChartData(summary.gender_distribution)} color="#0891b2" /></ChartCard>
          <ChartCard title="Vital Status Distribution" subtitle="Clinical metadata completeness and status"><BarBlock data={toChartData(summary.vital_status_distribution)} color="#4f46e5" /></ChartCard>
          <ChartCard title="Project Distribution" subtitle="TCGA project membership"><BarBlock data={toChartData(summary.project_distribution)} color="#2563eb" /></ChartCard>
          <ChartCard title="Age Distribution" subtitle="Age-at-diagnosis buckets"><BarBlock data={summary.age_distribution.map((x) => ({ name: x.bucket, value: x.count }))} color="#0f766e" /></ChartCard>
          <ChartCard title="Sample Type Distribution" subtitle="Sample-level metadata availability"><BarBlock data={toChartData(summary.sample_type_distribution)} color="#64748b" /></ChartCard>
        </div>
      )}

      <section className="panel p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Analysis-ready dataset checks</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Generate a data quality validation report before downstream analysis to inspect missing clinical metadata, invalid age values, and duplicate identifiers.</p>
          </div>
          <Link className="btn-secondary" to={`/cohorts/${id}/quality`}>Open report</Link>
        </div>
      </section>
    </div>
  );
}

function BarBlock({ data, color }: { data: Array<{ name: string; value: number }>; color: string }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="value" fill={color} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
