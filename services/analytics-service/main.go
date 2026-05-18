package main

import (
	"context"
	"log"
	"net/http"

	"biocohort/shared/config"
	"biocohort/shared/db"
	"biocohort/shared/httpclient"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type service struct{ db *pgxpool.Pool }

func main() {
	cfg := config.Load("8083")
	pool, err := db.Connect(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("analytics-service database startup failed: %v", err)
	}
	s := &service{db: pool}
	r := chi.NewRouter()
	for _, mw := range httpclient.Middleware() {
		r.Use(mw)
	}
	r.Get("/health", httpclient.Health)
	r.Get("/overview", s.overview)
	r.Get("/cohorts/{id}/summary", s.cohortSummary)
	log.Printf("analytics-service listening on :%s", cfg.Port)
	log.Fatal(http.ListenAndServe("0.0.0.0:"+cfg.Port, r))
}

func (s *service) overview(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	out := map[string]any{}
	for key, sql := range map[string]string{
		"total_cases":    "SELECT COUNT(*) FROM cases",
		"total_projects": "SELECT COUNT(*) FROM projects",
		"total_samples":  "SELECT COUNT(*) FROM samples",
		"total_cohorts":  "SELECT COUNT(*) FROM cohorts",
	} {
		var count int
		if err := s.db.QueryRow(ctx, sql).Scan(&count); err != nil {
			httpclient.Error(w, 500, err)
			return
		}
		out[key] = count
	}
	var err error
	if out["cases_by_project"], err = s.group(ctx, `SELECT project_id, COUNT(*) FROM cases GROUP BY project_id ORDER BY project_id`); err != nil {
		httpclient.Error(w, 500, err)
		return
	}
	if out["cases_by_gender"], err = s.group(ctx, `SELECT COALESCE(gender,'Unknown'), COUNT(*) FROM cases GROUP BY COALESCE(gender,'Unknown') ORDER BY 1`); err != nil {
		httpclient.Error(w, 500, err)
		return
	}
	if out["cases_by_vital_status"], err = s.group(ctx, `SELECT COALESCE(vital_status,'Unknown'), COUNT(*) FROM cases GROUP BY COALESCE(vital_status,'Unknown') ORDER BY 1`); err != nil {
		httpclient.Error(w, 500, err)
		return
	}
	httpclient.JSON(w, 200, out)
}

func (s *service) cohortSummary(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	ctx := r.Context()
	var total int
	if err := s.db.QueryRow(ctx, `SELECT COUNT(*) FROM cohort_cases WHERE cohort_id=$1`, id).Scan(&total); err != nil {
		httpclient.Error(w, 500, err)
		return
	}
	gender, err := s.group(ctx, `SELECT COALESCE(c.gender,'Unknown'), COUNT(*) FROM cases c JOIN cohort_cases cc ON cc.case_id=c.case_id WHERE cc.cohort_id=$1 GROUP BY COALESCE(c.gender,'Unknown') ORDER BY 1`, id)
	if err != nil {
		httpclient.Error(w, 500, err)
		return
	}
	vital, err := s.group(ctx, `SELECT COALESCE(c.vital_status,'Unknown'), COUNT(*) FROM cases c JOIN cohort_cases cc ON cc.case_id=c.case_id WHERE cc.cohort_id=$1 GROUP BY COALESCE(c.vital_status,'Unknown') ORDER BY 1`, id)
	if err != nil {
		httpclient.Error(w, 500, err)
		return
	}
	project, err := s.group(ctx, `SELECT c.project_id, COUNT(*) FROM cases c JOIN cohort_cases cc ON cc.case_id=c.case_id WHERE cc.cohort_id=$1 GROUP BY c.project_id ORDER BY 1`, id)
	if err != nil {
		httpclient.Error(w, 500, err)
		return
	}
	sampleTypes, err := s.group(ctx, `SELECT COALESCE(s.sample_type,'Unknown'), COUNT(*) FROM samples s JOIN cohort_cases cc ON cc.case_id=s.case_id WHERE cc.cohort_id=$1 GROUP BY COALESCE(s.sample_type,'Unknown') ORDER BY 1`, id)
	if err != nil {
		httpclient.Error(w, 500, err)
		return
	}
	age, err := s.ageBuckets(ctx, id)
	if err != nil {
		httpclient.Error(w, 500, err)
		return
	}
	httpclient.JSON(w, 200, map[string]any{"cohort_id": id, "total_cases": total, "gender_distribution": gender, "vital_status_distribution": vital, "project_distribution": project, "age_distribution": age, "sample_type_distribution": sampleTypes})
}

func (s *service) group(ctx context.Context, sql string, args ...any) (map[string]int, error) {
	rows, err := s.db.Query(ctx, sql, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[string]int{}
	for rows.Next() {
		var key string
		var count int
		if err := rows.Scan(&key, &count); err != nil {
			return nil, err
		}
		out[key] = count
	}
	return out, rows.Err()
}

func (s *service) ageBuckets(ctx context.Context, cohortID string) ([]map[string]any, error) {
	rows, err := s.db.Query(ctx, `SELECT
		CASE
			WHEN c.age_at_diagnosis IS NULL THEN 'Unknown'
			WHEN c.age_at_diagnosis <= 30 THEN '0-30'
			WHEN c.age_at_diagnosis <= 50 THEN '31-50'
			WHEN c.age_at_diagnosis <= 70 THEN '51-70'
			ELSE '71+'
		END AS bucket,
		COUNT(*)
		FROM cases c JOIN cohort_cases cc ON cc.case_id=c.case_id
		WHERE cc.cohort_id=$1
		GROUP BY bucket
		ORDER BY bucket`, cohortID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []map[string]any
	for rows.Next() {
		var bucket string
		var count int
		if err := rows.Scan(&bucket, &count); err != nil {
			return nil, err
		}
		out = append(out, map[string]any{"bucket": bucket, "count": count})
	}
	return out, rows.Err()
}
