import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { IngestionJob } from '../types';

export default function Ingestion() {
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  const load = () => api.get<IngestionJob[]>('/ingestion/jobs').then((res) => setJobs(res.data ?? [])).catch((err) => setError(err.message)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const start = async () => {
    setStarting(true);
    setError('');
    try {
      await api.post('/ingestion/jobs');
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold">GDC Metadata Ingestion</h1>
          <p className="mt-1 text-sm text-slate-600">Fetches public TCGA case metadata and stores raw API payloads in S3-compatible object storage.</p>
        </div>
        <button onClick={start} disabled={starting} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
          <RefreshCw size={16} /> {starting ? 'Starting...' : 'Start ingestion'}
        </button>
      </div>
      {error && <ErrorState message={error} />}
      {loading ? <LoadingState /> : (
        <div className="panel overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100 text-left text-slate-600">
              <tr><th className="p-3">Job</th><th className="p-3">Status</th><th className="p-3">Fetched</th><th className="p-3">Inserted</th><th className="p-3">Raw object</th><th className="p-3">Error</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((job) => (
                <tr key={job.job_id}>
                  <td className="p-3 font-mono text-xs">{job.job_id}</td>
                  <td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${badge(job.status)}`}>{job.status}</span></td>
                  <td className="p-3">{job.records_fetched}</td>
                  <td className="p-3">{job.records_inserted}</td>
                  <td className="p-3 font-mono text-xs">{job.raw_object_key ?? '-'}</td>
                  <td className="p-3 text-red-700">{job.error_message ?? '-'}</td>
                </tr>
              ))}
              {jobs.length === 0 && <tr><td className="p-6 text-slate-500" colSpan={6}>No ingestion jobs yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function badge(status: string) {
  if (status === 'COMPLETED') return 'bg-emerald-50 text-emerald-700';
  if (status === 'FAILED') return 'bg-red-50 text-red-700';
  return 'bg-amber-50 text-amber-700';
}
