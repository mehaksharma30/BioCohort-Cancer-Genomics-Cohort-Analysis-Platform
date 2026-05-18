export type Overview = {
  total_cases: number;
  total_projects: number;
  total_samples: number;
  total_cohorts: number;
  cases_by_project: Record<string, number>;
  cases_by_gender: Record<string, number>;
  cases_by_vital_status: Record<string, number>;
};

export type Project = {
  project_id: string;
  name: string;
  disease_type: string;
  primary_site: string;
};

export type CohortFilters = {
  project_id?: string;
  primary_site?: string;
  disease_type?: string;
  gender?: string;
  vital_status?: string;
  min_age?: number;
  max_age?: number;
};

export type Cohort = {
  cohort_id: string;
  name: string;
  description: string;
  filters: CohortFilters;
  case_count: number;
  created_at?: string;
};

export type IngestionJob = {
  job_id: string;
  source: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  records_fetched: number;
  records_inserted: number;
  raw_object_key?: string;
  error_message?: string;
  started_at: string;
  completed_at?: string;
};

export type CohortSummary = {
  cohort_id: string;
  total_cases: number;
  gender_distribution: Record<string, number>;
  vital_status_distribution: Record<string, number>;
  project_distribution: Record<string, number>;
  sample_type_distribution: Record<string, number>;
  age_distribution: Array<{ bucket: string; count: number }>;
};

export type QualityReport = {
  report_id: string;
  cohort_id: string;
  quality_score: number;
  total_records: number;
  missing_age_count: number;
  missing_gender_count: number;
  missing_vital_status_count: number;
  duplicate_case_count: number;
  invalid_age_count: number;
};
