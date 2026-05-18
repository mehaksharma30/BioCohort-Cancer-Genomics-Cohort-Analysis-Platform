package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"biocohort/shared/config"
	"biocohort/shared/db"
	"biocohort/shared/httpclient"
	"biocohort/shared/storage"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

const gdcCasesURL = "https://api.gdc.cancer.gov/cases"

type service struct {
	db      *pgxpool.Pool
	storage *storage.Client
}

type gdcResponse struct {
	Data struct {
		Hits []gdcCase `json:"hits"`
	} `json:"data"`
}

type gdcCase struct {
	CaseID      string `json:"case_id"`
	SubmitterID string `json:"submitter_id"`
	Project     struct {
		ProjectID string `json:"project_id"`
		Name      string `json:"name"`
	} `json:"project"`
	DiseaseType string `json:"disease_type"`
	PrimarySite string `json:"primary_site"`
	Demographic struct {
		Gender string `json:"gender"`
	} `json:"demographic"`
	Diagnoses []struct {
		AgeAtDiagnosis        *int   `json:"age_at_diagnosis"`
		VitalStatus           string `json:"vital_status"`
		DaysToDeath           *int   `json:"days_to_death"`
		DaysToLastFollowUp    *int   `json:"days_to_last_follow_up"`
		PrimaryDiagnosis      string `json:"primary_diagnosis"`
		ClassificationOfTumor string `json:"classification_of_tumor"`
	} `json:"diagnoses"`
	Samples []struct {
		SampleID   string `json:"sample_id"`
		SampleType string `json:"sample_type"`
		TissueType string `json:"tissue_type"`
	} `json:"samples"`
}

func main() {
	cfg := config.Load("8081")
	ctx := context.Background()
	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("ingestion-service database startup failed: %v", err)
	}
	store, err := storage.New(cfg)
	if err != nil {
		log.Fatalf("ingestion-service storage startup failed: %v", err)
	}
	s := &service{db: pool, storage: store}

	r := chi.NewRouter()
	for _, mw := range httpclient.Middleware() {
		r.Use(mw)
	}
	r.Get("/health", httpclient.Health)
	r.Get("/projects", s.projects)
	r.Get("/cancer-types", s.cancerTypes)
	r.Get("/cases", s.cases)
	r.Post("/ingestion/jobs", s.startJob)
	r.Get("/ingestion/jobs", s.jobs)

	log.Printf("ingestion-service listening on :%s", cfg.Port)
	log.Fatal(http.ListenAndServe("0.0.0.0:"+cfg.Port, r))
}

func (s *service) projects(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query(r.Context(), `SELECT project_id, name, disease_type, primary_site, created_at FROM projects ORDER BY project_id`)
	if err != nil {
		httpclient.Error(w, 500, err)
		return
	}
	defer rows.Close()
	var out []map[string]any
	for rows.Next() {
		var p struct {
			id, name, disease, site string
			created                 time.Time
		}
		if err := rows.Scan(&p.id, &p.name, &p.disease, &p.site, &p.created); err != nil {
			httpclient.Error(w, 500, err)
			return
		}
		out = append(out, map[string]any{"project_id": p.id, "name": p.name, "disease_type": p.disease, "primary_site": p.site, "created_at": p.created})
	}
	httpclient.JSON(w, 200, out)
}

func (s *service) cancerTypes(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query(r.Context(), `SELECT disease_type, COUNT(*) FROM cases GROUP BY disease_type ORDER BY disease_type`)
	if err != nil {
		httpclient.Error(w, 500, err)
		return
	}
	defer rows.Close()
	var out []map[string]any
	for rows.Next() {
		var disease string
		var count int
		if err := rows.Scan(&disease, &count); err != nil {
			httpclient.Error(w, 500, err)
			return
		}
		out = append(out, map[string]any{"disease_type": disease, "case_count": count})
	}
	httpclient.JSON(w, 200, out)
}

func (s *service) cases(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	limit := parseLimit(q.Get("limit"), 100)
	args := []any{}
	clauses := []string{"1=1"}
	for _, field := range []string{"project_id", "primary_site", "gender", "vital_status"} {
		if v := q.Get(field); v != "" {
			args = append(args, v)
			clauses = append(clauses, fmt.Sprintf("%s=$%d", field, len(args)))
		}
	}
	args = append(args, limit)
	sql := `SELECT case_id, project_id, submitter_id, primary_site, disease_type, gender, age_at_diagnosis, vital_status, days_to_death, days_to_last_follow_up, created_at FROM cases WHERE ` + strings.Join(clauses, " AND ") + fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d", len(args))
	rows, err := s.db.Query(r.Context(), sql, args...)
	if err != nil {
		httpclient.Error(w, 500, err)
		return
	}
	defer rows.Close()
	var out []map[string]any
	for rows.Next() {
		var c mapCase
		if err := rows.Scan(&c.CaseID, &c.ProjectID, &c.SubmitterID, &c.PrimarySite, &c.DiseaseType, &c.Gender, &c.Age, &c.VitalStatus, &c.DaysToDeath, &c.DaysToLast, &c.CreatedAt); err != nil {
			httpclient.Error(w, 500, err)
			return
		}
		out = append(out, c.JSON())
	}
	httpclient.JSON(w, 200, out)
}

type mapCase struct {
	CaseID, ProjectID, SubmitterID, PrimarySite, DiseaseType string
	Gender, VitalStatus                                      *string
	Age, DaysToDeath, DaysToLast                             *int
	CreatedAt                                                time.Time
}

func (c mapCase) JSON() map[string]any {
	return map[string]any{"case_id": c.CaseID, "project_id": c.ProjectID, "submitter_id": c.SubmitterID, "primary_site": c.PrimarySite, "disease_type": c.DiseaseType, "gender": c.Gender, "age_at_diagnosis": c.Age, "vital_status": c.VitalStatus, "days_to_death": c.DaysToDeath, "days_to_last_follow_up": c.DaysToLast, "created_at": c.CreatedAt}
}

func (s *service) startJob(w http.ResponseWriter, r *http.Request) {
	jobID := uuid.New().String()
	_, err := s.db.Exec(r.Context(), `INSERT INTO ingestion_jobs (job_id, source, status) VALUES ($1, 'NCI GDC API', 'RUNNING')`, jobID)
	if err != nil {
		httpclient.Error(w, 500, err)
		return
	}
	go s.runJob(context.Background(), jobID)
	httpclient.JSON(w, 202, map[string]any{"job_id": jobID, "status": "RUNNING"})
}

func (s *service) runJob(ctx context.Context, jobID string) {
	raw, cases, err := fetchGDC(ctx)
	if err != nil {
		msg := "GDC fetch failed; seeded fallback data remains available: " + err.Error()
		_, _ = s.db.Exec(ctx, `UPDATE ingestion_jobs SET status='FAILED', error_message=$2, completed_at=NOW() WHERE job_id=$1`, jobID, msg)
		log.Print(msg)
		return
	}
	key := "gdc/jobs/" + jobID + ".json"
	if err := s.storage.PutJSON(ctx, key, raw); err != nil {
		_, _ = s.db.Exec(ctx, `UPDATE ingestion_jobs SET status='FAILED', records_fetched=$2, error_message=$3, completed_at=NOW() WHERE job_id=$1`, jobID, len(cases), err.Error())
		return
	}
	inserted, err := s.insertCases(ctx, cases)
	if err != nil {
		_, _ = s.db.Exec(ctx, `UPDATE ingestion_jobs SET status='FAILED', records_fetched=$2, raw_object_key=$3, error_message=$4, completed_at=NOW() WHERE job_id=$1`, jobID, len(cases), key, err.Error())
		return
	}
	_, _ = s.db.Exec(ctx, `UPDATE ingestion_jobs SET status='COMPLETED', records_fetched=$2, records_inserted=$3, raw_object_key=$4, completed_at=NOW() WHERE job_id=$1`, jobID, len(cases), inserted, key)
}

func fetchGDC(ctx context.Context) ([]byte, []gdcCase, error) {
	fields := []string{"case_id", "submitter_id", "project.project_id", "project.name", "disease_type", "primary_site", "demographic.gender", "diagnoses.age_at_diagnosis", "diagnoses.vital_status", "diagnoses.days_to_death", "diagnoses.days_to_last_follow_up", "samples.sample_id", "samples.sample_type", "samples.tissue_type"}
	body := map[string]any{
		"filters": map[string]any{"op": "in", "content": map[string]any{"field": "project.project_id", "value": []string{"TCGA-BRCA", "TCGA-LUAD", "TCGA-COAD", "TCGA-GBM", "TCGA-PRAD"}}},
		"fields":  strings.Join(fields, ","),
		"format":  "JSON",
		"size":    "100",
	}
	payload, _ := json.Marshal(body)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, gdcCasesURL, bytes.NewReader(payload))
	if err != nil {
		return nil, nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, nil, err
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, nil, err
	}
	if resp.StatusCode >= 300 {
		return raw, nil, fmt.Errorf("gdc returned status %d", resp.StatusCode)
	}
	var parsed gdcResponse
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return raw, nil, err
	}
	if len(parsed.Data.Hits) == 0 {
		return raw, nil, errors.New("gdc returned no cases")
	}
	return raw, parsed.Data.Hits, nil
}

func (s *service) insertCases(ctx context.Context, cases []gdcCase) (int, error) {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)
	inserted := 0
	for _, c := range cases {
		if c.CaseID == "" || c.Project.ProjectID == "" {
			continue
		}
		diagnosis := firstDiagnosis(c)
		_, err := tx.Exec(ctx, `INSERT INTO projects (project_id, name, disease_type, primary_site) VALUES ($1,$2,$3,$4)
			ON CONFLICT (project_id) DO UPDATE SET name=EXCLUDED.name, disease_type=EXCLUDED.disease_type, primary_site=EXCLUDED.primary_site`,
			c.Project.ProjectID, fallback(c.Project.Name, c.Project.ProjectID), c.DiseaseType, c.PrimarySite)
		if err != nil {
			return 0, err
		}
		tag, err := tx.Exec(ctx, `INSERT INTO cases (case_id, project_id, submitter_id, primary_site, disease_type, gender, age_at_diagnosis, vital_status, days_to_death, days_to_last_follow_up)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
			ON CONFLICT (case_id) DO UPDATE SET project_id=EXCLUDED.project_id, submitter_id=EXCLUDED.submitter_id, primary_site=EXCLUDED.primary_site, disease_type=EXCLUDED.disease_type, gender=EXCLUDED.gender, age_at_diagnosis=EXCLUDED.age_at_diagnosis, vital_status=EXCLUDED.vital_status`,
			c.CaseID, c.Project.ProjectID, c.SubmitterID, c.PrimarySite, c.DiseaseType, nullable(c.Demographic.Gender), diagnosis.age, nullable(diagnosis.vital), diagnosis.death, diagnosis.followUp)
		if err != nil {
			return 0, err
		}
		inserted += int(tag.RowsAffected())
		for _, sm := range c.Samples {
			if sm.SampleID == "" {
				continue
			}
			_, err := tx.Exec(ctx, `INSERT INTO samples (sample_id, case_id, sample_type, tissue_type, data_category, data_type) VALUES ($1,$2,$3,$4,'Clinical','Case Metadata')
				ON CONFLICT (sample_id) DO UPDATE SET sample_type=EXCLUDED.sample_type, tissue_type=EXCLUDED.tissue_type`, sm.SampleID, c.CaseID, sm.SampleType, sm.TissueType)
			if err != nil {
				return 0, err
			}
		}
	}
	return inserted, tx.Commit(ctx)
}

type diag struct {
	age, death, followUp *int
	vital                string
}

func firstDiagnosis(c gdcCase) diag {
	if len(c.Diagnoses) == 0 {
		return diag{}
	}
	d := c.Diagnoses[0]
	return diag{age: d.AgeAtDiagnosis, death: d.DaysToDeath, followUp: d.DaysToLastFollowUp, vital: d.VitalStatus}
}

func (s *service) jobs(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query(r.Context(), `SELECT job_id::text, source, status, records_fetched, records_inserted, raw_object_key, error_message, started_at, completed_at FROM ingestion_jobs ORDER BY started_at DESC LIMIT 50`)
	if err != nil {
		httpclient.Error(w, 500, err)
		return
	}
	defer rows.Close()
	var out []map[string]any
	for rows.Next() {
		var id, source, status string
		var fetched, inserted int
		var rawKey, errMsg *string
		var started time.Time
		var completed *time.Time
		if err := rows.Scan(&id, &source, &status, &fetched, &inserted, &rawKey, &errMsg, &started, &completed); err != nil {
			httpclient.Error(w, 500, err)
			return
		}
		out = append(out, map[string]any{"job_id": id, "source": source, "status": status, "records_fetched": fetched, "records_inserted": inserted, "raw_object_key": rawKey, "error_message": errMsg, "started_at": started, "completed_at": completed})
	}
	httpclient.JSON(w, 200, out)
}

func parseLimit(value string, fallback int) int {
	if value == "" {
		return fallback
	}
	n, err := strconv.Atoi(value)
	if err != nil || n <= 0 || n > 500 {
		return fallback
	}
	return n
}

func nullable(value string) any {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return value
}

func fallback(value, fallback string) string {
	if strings.TrimSpace(value) == "" {
		return fallback
	}
	return value
}
