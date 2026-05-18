import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { QualityReport as Report } from '../types';

export default function QualityReport() {
  const { id } = useParams();
  const [report, setReport] = useState<Report>();
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Report>(`/cohorts/${id}/quality-report`)
      .then((res) => setReport(res.data))
      .catch(() => api.post<Report>(`/cohorts/${id}/quality-report`).then((res) => setReport(res.data)).catch((err) => setError(err.message)));
  }, [id]);

  if (error) return <ErrorState message={error} />;
  if (!report) return <LoadingState label="Preparing quality report" />;

  const rows = [
    ['Missing age', report.missing_age_count],
    ['Missing gender', report.missing_gender_count],
    ['Missing vital status', report.missing_vital_status_count],
    ['Duplicate case IDs', report.duplicate_case_count],
    ['Invalid age', report.invalid_age_count]
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Quality Report</h1>
        <p className="mt-1 text-sm text-slate-600">Completeness and validity checks for the selected cohort.</p>
      </div>
      <div className="panel p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Quality score</p>
            <p className="mt-2 text-5xl font-semibold text-slate-950">{report.quality_score.toFixed(1)}</p>
          </div>
          <div className="h-4 w-full max-w-md rounded-full bg-slate-200">
            <div className="h-4 rounded-full bg-blue-600" style={{ width: `${Math.max(0, Math.min(100, report.quality_score))}%` }} />
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Total records" value={report.total_records} />
        {rows.map(([label, value]) => <Metric key={label} label={String(label)} value={Number(value)} />)}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
