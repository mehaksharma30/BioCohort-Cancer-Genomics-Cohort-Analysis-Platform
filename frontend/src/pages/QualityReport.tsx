import { AlertTriangle, CheckCircle2, Database, ShieldCheck, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, friendlyMessage } from '../api/client';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import QualityScoreCard from '../components/QualityScoreCard';
import StatCard from '../components/StatCard';
import { QualityReport as Report } from '../types';

export default function QualityReport() {
  const { id } = useParams();
  const [report, setReport] = useState<Report>();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  const load = async () => {
    setError('');
    setNotFound(false);
    try {
      const res = await api.get<Report>(`/cohorts/${id}/quality-report`);
      setReport(res.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setNotFound(true);
        setReport(undefined);
      } else {
        setError(friendlyMessage(err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const generate = async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await api.post<Report>(`/cohorts/${id}/quality-report`);
      setReport(res.data);
      setNotFound(false);
    } catch (err: any) {
      setError(friendlyMessage(err.message));
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <LoadingState label="Loading data quality report" />;

  return (
    <div className="space-y-7">
      <PageHeader
        title="Data Quality Report"
        subtitle="Evaluate cohort completeness, invalid values, and duplicate identifiers before downstream analysis."
        badge="Clinical metadata completeness"
        action={<button onClick={generate} disabled={generating} className="btn-primary"><ShieldCheck size={16} /> {generating ? 'Generating report' : 'Generate Report'}</button>}
      />

      {error && <ErrorState message={error} onRetry={load} />}

      {notFound && !report ? (
        <EmptyState
          title="No quality report yet"
          message="Generate a report to calculate missing clinical metadata, invalid ages, duplicate identifiers, and an overall quality score."
          action={<button onClick={generate} disabled={generating} className="btn-primary"><ShieldCheck size={16} /> {generating ? 'Generating report' : 'Generate Quality Report'}</button>}
        />
      ) : report ? (
        <>
          <QualityScoreCard score={report.quality_score} totalRecords={report.total_records} />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard icon={Database} label="Total Records" value={report.total_records} helper="Cohort records evaluated" />
            <StatCard icon={AlertTriangle} label="Missing Age" value={report.missing_age_count} helper="Missing age_at_diagnosis" />
            <StatCard icon={AlertTriangle} label="Missing Gender" value={report.missing_gender_count} helper="Missing demographic gender" />
            <StatCard icon={AlertTriangle} label="Missing Vital Status" value={report.missing_vital_status_count} helper="Missing clinical status" />
            <StatCard icon={XCircle} label="Invalid Age" value={report.invalid_age_count} helper="Age below 0 or above 120" />
            <StatCard icon={CheckCircle2} label="Duplicate Cases" value={report.duplicate_case_count} helper="Duplicate case identifiers" />
          </div>

          <section className="panel p-6">
            <h2 className="text-lg font-semibold text-slate-950">Scoring Method</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Quality score starts at 100 and subtracts penalties for missing or invalid clinical metadata. The report is designed to support data quality validation before downstream analysis, not diagnosis prediction or clinical decision support.
            </p>
          </section>
        </>
      ) : null}
    </div>
  );
}
