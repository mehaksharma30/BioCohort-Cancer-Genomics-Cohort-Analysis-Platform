import { Activity, ArrowRight, CheckCircle2, Cloud, Database, Dna, FlaskConical, Gauge, Server, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useEffect, useState } from 'react';
import { api, friendlyMessage, toChartData } from '../api/client';
import ChartCard from '../components/ChartCard';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { Overview } from '../types';

const colors = ['#2563eb', '#0891b2', '#4f46e5', '#0f766e', '#64748b'];

const pipeline = ['GDC/TCGA API', 'Ingestion Service', 'PostgreSQL + S3', 'Cohort Service', 'Analytics + Quality', 'React Dashboard'];

const services = [
  { name: 'API Gateway', role: 'Backend-for-frontend routing', endpoint: ':8080', icon: Server },
  { name: 'Ingestion Service', role: 'Public GDC metadata import', endpoint: ':8081', icon: Cloud },
  { name: 'Cohort Service', role: 'Filter definitions and membership', endpoint: ':8082', icon: FlaskConical },
  { name: 'Analytics Service', role: 'SQL aggregation summaries', endpoint: ':8083', icon: Gauge },
  { name: 'Quality Service', role: 'Completeness validation', endpoint: ':8084', icon: ShieldCheck }
];

export default function Dashboard() {
  const [data, setData] = useState<Overview>();
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    api.get<Overview>('/overview').then((res) => setData(res.data)).catch((err) => setError(friendlyMessage(err.message)));
  };

  useEffect(() => {
    load();
  }, []);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <LoadingState label="Loading platform overview" />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Cancer Genomics Cohort Intelligence"
        subtitle="Explore public TCGA/GDC metadata, build research cohorts, and validate analysis-ready datasets through cloud-native services."
        badge="Go Microservices • React • PostgreSQL • S3-ready"
        action={
          <>
            <Link className="btn-primary" to="/ingestion">Start Ingestion <ArrowRight size={16} /></Link>
            <Link className="btn-secondary" to="/cohorts/new">Build Cohort</Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Dna} label="Total Cases" value={data.total_cases} helper="Normalized public case metadata" trend="Seed data available immediately" />
        <StatCard icon={Database} label="TCGA Projects" value={data.total_projects} helper="BRCA, LUAD, COAD, GBM, PRAD" />
        <StatCard icon={Activity} label="Samples" value={data.total_samples} helper="Sample-level metadata records" />
        <StatCard icon={FlaskConical} label="Saved Cohorts" value={data.total_cohorts} helper="Reusable cohort definitions" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Cases by Project" subtitle="Project-level public TCGA/GDC metadata coverage">
          <ResponsiveContainer>
            <BarChart data={toChartData(data.cases_by_project)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Gender Distribution" subtitle="Clinical metadata demographics">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={toChartData(data.cases_by_gender)} dataKey="value" nameKey="name" outerRadius={100} label>
                {toChartData(data.cases_by_gender).map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Vital Status" subtitle="Clinical metadata completeness and outcomes labels">
          <ResponsiveContainer>
            <BarChart data={toChartData(data.cases_by_vital_status)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#0891b2" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <section className="panel p-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-slate-950">Platform Pipeline</h2>
          <p className="text-sm text-slate-500">Raw payload archived to S3-compatible storage, structured metadata modeled in PostgreSQL, and analysis-ready cohorts served through Go microservices.</p>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-6">
          {pipeline.map((step, index) => (
            <div key={step} className="relative rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-700 ring-1 ring-blue-100">{index + 1}</div>
              <div className="text-sm font-semibold text-slate-900">{step}</div>
              {index < pipeline.length - 1 && <ArrowRight className="absolute -right-5 top-1/2 hidden text-slate-300 md:block" size={20} />}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">System Services</h2>
          <p className="mt-1 text-sm text-slate-500">Cloud-native service boundaries aligned with ingestion, cohort management, analytics, and data quality validation.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {services.map(({ name, role, endpoint, icon: Icon }) => (
            <div key={name} className="panel p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700"><Icon size={20} /></div>
                <span className="font-mono text-xs font-semibold text-slate-400">{endpoint}</span>
              </div>
              <h3 className="font-semibold text-slate-950">{name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{role}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 size={14} /> Docker Compose</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
