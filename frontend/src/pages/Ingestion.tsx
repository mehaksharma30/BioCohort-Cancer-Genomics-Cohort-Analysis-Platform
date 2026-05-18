import { AlertTriangle, Database, RefreshCw, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api, formatDate, friendlyMessage } from '../api/client';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { IngestionJob } from '../types';

export default function Ingestion() {
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alert, setAlert] = useState('');
  const [starting, setStarting] = useState(false);

  const hasRunningJob = useMemo(() => jobs.some((job) => job.status === 'RUNNING'), [jobs]);

  const load = async () => {
    setError('');
    try {
      const res = await api.get<IngestionJob[]>('/ingestion/jobs');
      setJobs(res.data ?? []);
    } catch (err: any) {
      setError(friendlyMessage(err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const start = async () => {
    setStarting(true);
    setError('');
    setAlert('');
    try {
      await api.post('/ingestion/jobs');
      setAlert('Ingestion job started. Public GDC metadata will be normalized and raw payloads archived to S3-compatible storage.');
      await load();
      window.setTimeout(load, 2500);
    } catch (err: any) {
      setError(friendlyMessage(err.message));
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-7">
      <PageHeader
        title="GDC Metadata Ingestion"
        subtitle="Fetch public TCGA case metadata, normalize clinical and sample-level fields, and archive raw payloads to S3-compatible object storage."
        badge="Public TCGA/GDC metadata only"
        action={
          <button onClick={start} disabled={starting || hasRunningJob} className="btn-primary">
            <RefreshCw className={starting || hasRunningJob ? 'animate-spin' : ''} size={16} />
            {starting || hasRunningJob ? 'Ingestion running' : 'Start Ingestion'}
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <div className="flex gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700"><Database size={22} /></div>
            <div>
              <h2 className="font-semibold text-slate-950">Research metadata ingestion flow</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This service queries the NCI GDC cases endpoint for selected TCGA projects, stores raw JSON payloads in MinIO, and upserts structured project, case, and sample metadata into PostgreSQL.
              </p>
            </div>
          </div>
        </div>
        <div className="panel p-5">
          <div className="flex gap-3">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><ShieldCheck size={22} /></div>
            <div>
              <h2 className="font-semibold text-slate-950">No PHI stored</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">This demo uses public TCGA/GDC research metadata only. It is not clinical decision support.</p>
            </div>
          </div>
        </div>
      </div>

      {alert && <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-800">{alert}</div>}
      {jobs.some((job) => job.status === 'COMPLETED_WITH_FALLBACK') && (
        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          <div>
            <div className="font-semibold">External source unavailable or schema changed.</div>
            <p className="mt-1">Demo continues using seeded TCGA metadata for dashboard, cohort, analytics, and data quality workflows.</p>
          </div>
        </div>
      )}
      {error && <ErrorState message={error} onRetry={load} />}

      {loading ? <LoadingState label="Loading ingestion history" /> : (
        <section className="panel overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-950">Ingestion Job History</h2>
            <p className="mt-1 text-sm text-slate-500">Track external ingestion attempts, inserted records, and raw payload archive keys.</p>
          </div>
          {jobs.length === 0 ? (
            <EmptyState title="No ingestion jobs yet" message="Start an ingestion job to fetch public TCGA/GDC metadata or continue using the seeded demo dataset." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Job ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Fetched</th>
                    <th className="px-4 py-3">Inserted</th>
                    <th className="px-4 py-3">Raw Object</th>
                    <th className="px-4 py-3">Message</th>
                    <th className="px-4 py-3">Started</th>
                    <th className="px-4 py-3">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {jobs.map((job) => (
                    <tr key={job.job_id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">{job.job_id.slice(0, 8)}</td>
                      <td className="whitespace-nowrap px-4 py-3"><StatusBadge status={job.status} /></td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{job.records_fetched}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{job.records_inserted}</td>
                      <td className="min-w-48 px-4 py-3 font-mono text-xs text-slate-600">{job.raw_object_key || '-'}</td>
                      <td className="min-w-72 px-4 py-3 text-slate-600">{messageFor(job)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(job.started_at)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(job.completed_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function messageFor(job: IngestionJob) {
  if (job.status === 'COMPLETED') return 'External GDC metadata normalized successfully.';
  if (job.status === 'COMPLETED_WITH_FALLBACK') return 'External GDC ingestion did not complete; seeded TCGA demo data remains available.';
  if (job.status === 'RUNNING') return 'Fetching and normalizing public GDC metadata.';
  return friendlyMessage(job.error_message ?? 'No message available.');
}
