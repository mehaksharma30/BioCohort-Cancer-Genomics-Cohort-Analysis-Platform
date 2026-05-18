CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS projects (
  project_id TEXT PRIMARY KEY,
  name TEXT,
  disease_type TEXT,
  primary_site TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cases (
  case_id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(project_id),
  submitter_id TEXT,
  primary_site TEXT,
  disease_type TEXT,
  gender TEXT,
  age_at_diagnosis INT,
  vital_status TEXT,
  days_to_death INT NULL,
  days_to_last_follow_up INT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS samples (
  sample_id TEXT PRIMARY KEY,
  case_id TEXT REFERENCES cases(case_id),
  sample_type TEXT,
  tissue_type TEXT,
  data_category TEXT,
  data_type TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingestion_jobs (
  job_id UUID PRIMARY KEY,
  source TEXT,
  status TEXT,
  records_fetched INT DEFAULT 0,
  records_inserted INT DEFAULT 0,
  raw_object_key TEXT,
  error_message TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS cohorts (
  cohort_id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  filters JSONB NOT NULL,
  case_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cohort_cases (
  cohort_id UUID REFERENCES cohorts(cohort_id) ON DELETE CASCADE,
  case_id TEXT REFERENCES cases(case_id) ON DELETE CASCADE,
  PRIMARY KEY (cohort_id, case_id)
);

CREATE TABLE IF NOT EXISTS quality_reports (
  report_id UUID PRIMARY KEY,
  cohort_id UUID REFERENCES cohorts(cohort_id) ON DELETE CASCADE,
  quality_score FLOAT,
  total_records INT,
  missing_age_count INT,
  missing_gender_count INT,
  missing_vital_status_count INT,
  duplicate_case_count INT,
  invalid_age_count INT,
  missing_fields JSONB,
  generated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cases_project ON cases(project_id);
CREATE INDEX IF NOT EXISTS idx_cases_filters ON cases(primary_site, gender, vital_status);
CREATE INDEX IF NOT EXISTS idx_samples_case ON samples(case_id);
