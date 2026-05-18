import { Activity, Database, Dna, FlaskConical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useEffect, useState } from 'react';
import { api, toChartData } from '../api/client';
import ChartCard from '../components/ChartCard';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import StatCard from '../components/StatCard';
import { Overview } from '../types';

const colors = ['#2563eb', '#0f766e', '#7c3aed', '#ea580c', '#64748b'];

export default function Dashboard() {
  const [data, setData] = useState<Overview>();
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Overview>('/overview').then((res) => setData(res.data)).catch((err) => setError(err.message));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Research Cohort Overview</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">Public TCGA/GDC metadata summarized for exploratory cohort design and data quality review.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700" to="/ingestion">Start ingestion</Link>
          <Link className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100" to="/cohorts/new">Build cohort</Link>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Dna} label="Total cases" value={data.total_cases} />
        <StatCard icon={Database} label="Projects" value={data.total_projects} />
        <StatCard icon={Activity} label="Samples" value={data.total_samples} />
        <StatCard icon={FlaskConical} label="Cohorts" value={data.total_cohorts} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Cases by project">
          <ResponsiveContainer>
            <BarChart data={toChartData(data.cases_by_project)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Gender distribution">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={toChartData(data.cases_by_gender)} dataKey="value" nameKey="name" outerRadius={100} label>
                {toChartData(data.cases_by_gender).map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Vital status">
          <ResponsiveContainer>
            <BarChart data={toChartData(data.cases_by_vital_status)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#0f766e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
