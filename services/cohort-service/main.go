package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"biocohort/shared/config"
	"biocohort/shared/db"
	"biocohort/shared/httpclient"
	"biocohort/shared/models"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type service struct{ db *pgxpool.Pool }

type createCohortRequest struct {
	Name        string               `json:"name"`
	Description string               `json:"description"`
	Filters     models.CohortFilters `json:"filters"`
}

func main() {
	cfg := config.Load("8082")
	pool, err := db.Connect(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("cohort-service database startup failed: %v", err)
	}
	s := &service{db: pool}
	r := chi.NewRouter()
	for _, mw := range httpclient.Middleware() {
		r.Use(mw)
	}
	r.Get("/health", httpclient.Health)
	r.Get("/cohorts", s.listCohorts)
	r.Post("/cohorts", s.createCohort)
	r.Get("/cohorts/{id}", s.getCohort)
	r.Get("/cohorts/{id}/cases", s.getCohortCases)
	log.Printf("cohort-service listening on :%s", cfg.Port)
	log.Fatal(http.ListenAndServe("0.0.0.0:"+cfg.Port, r))
}

func (s *service) listCohorts(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query(r.Context(), `SELECT cohort_id::text, name, description, filters, case_count, created_at FROM cohorts ORDER BY created_at DESC`)
	if err != nil {
		httpclient.Error(w, 500, err)
		return
	}
	defer rows.Close()
	cohorts, err := scanCohorts(rows)
	if err != nil {
		httpclient.Error(w, 500, err)
		return
	}
	httpclient.JSON(w, 200, cohorts)
}

func (s *service) createCohort(w http.ResponseWriter, r *http.Request) {
	var req createCohortRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpclient.Error(w, 400, err)
		return
	}
	if strings.TrimSpace(req.Name) == "" {
		httpclient.Error(w, 400, fmt.Errorf("name is required"))
		return
	}
	cohortID := uuid.New().String()
	filterBytes, _ := json.Marshal(req.Filters)
	sql, args := buildCaseFilterQuery(req.Filters)

	tx, err := s.db.Begin(r.Context())
	if err != nil {
		httpclient.Error(w, 500, err)
		return
	}
	defer tx.Rollback(r.Context())
	rows, err := tx.Query(r.Context(), sql, args...)
	if err != nil {
		httpclient.Error(w, 500, err)
		return
	}
	var caseIDs []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			rows.Close()
			httpclient.Error(w, 500, err)
			return
		}
		caseIDs = append(caseIDs, id)
	}
	rows.Close()
	_, err = tx.Exec(r.Context(), `INSERT INTO cohorts (cohort_id, name, description, filters, case_count) VALUES ($1,$2,$3,$4,$5)`, cohortID, req.Name, req.Description, filterBytes, len(caseIDs))
	if err != nil {
		httpclient.Error(w, 500, err)
		return
	}
	for _, id := range caseIDs {
		if _, err := tx.Exec(r.Context(), `INSERT INTO cohort_cases (cohort_id, case_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, cohortID, id); err != nil {
			httpclient.Error(w, 500, err)
			return
		}
	}
	if err := tx.Commit(r.Context()); err != nil {
		httpclient.Error(w, 500, err)
		return
	}
	httpclient.JSON(w, 201, map[string]any{"cohort_id": cohortID, "name": req.Name, "description": req.Description, "filters": req.Filters, "case_count": len(caseIDs)})
}

func (s *service) getCohort(w http.ResponseWriter, r *http.Request) {
	cohort, err := s.fetchCohort(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		status := 500
		if err == pgx.ErrNoRows {
			status = 404
		}
		httpclient.Error(w, status, err)
		return
	}
	httpclient.JSON(w, 200, cohort)
}

func (s *service) fetchCohort(ctx context.Context, id string) (models.Cohort, error) {
	var c models.Cohort
	var raw []byte
	err := s.db.QueryRow(ctx, `SELECT cohort_id::text, name, description, filters, case_count, created_at FROM cohorts WHERE cohort_id=$1`, id).
		Scan(&c.CohortID, &c.Name, &c.Description, &raw, &c.CaseCount, &c.CreatedAt)
	if err != nil {
		return c, err
	}
	if err := json.Unmarshal(raw, &c.Filters); err != nil {
		return c, err
	}
	return c, nil
}

func (s *service) getCohortCases(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query(r.Context(), `SELECT c.case_id, c.project_id, c.submitter_id, c.primary_site, c.disease_type, c.gender, c.age_at_diagnosis, c.vital_status, c.created_at
		FROM cases c JOIN cohort_cases cc ON cc.case_id=c.case_id WHERE cc.cohort_id=$1 ORDER BY c.case_id`, chi.URLParam(r, "id"))
	if err != nil {
		httpclient.Error(w, 500, err)
		return
	}
	defer rows.Close()
	var out []map[string]any
	for rows.Next() {
		var id, project, submitter, site, disease string
		var gender, vital *string
		var age *int
		var created time.Time
		if err := rows.Scan(&id, &project, &submitter, &site, &disease, &gender, &age, &vital, &created); err != nil {
			httpclient.Error(w, 500, err)
			return
		}
		out = append(out, map[string]any{"case_id": id, "project_id": project, "submitter_id": submitter, "primary_site": site, "disease_type": disease, "gender": gender, "age_at_diagnosis": age, "vital_status": vital, "created_at": created})
	}
	httpclient.JSON(w, 200, out)
}

func buildCaseFilterQuery(f models.CohortFilters) (string, []any) {
	args := []any{}
	clauses := []string{"1=1"}
	add := func(column, value string) {
		if strings.TrimSpace(value) != "" {
			args = append(args, value)
			clauses = append(clauses, fmt.Sprintf("%s=$%d", column, len(args)))
		}
	}
	add("project_id", f.ProjectID)
	add("primary_site", f.PrimarySite)
	add("disease_type", f.DiseaseType)
	add("gender", f.Gender)
	add("vital_status", f.VitalStatus)
	if f.MinAge != nil {
		args = append(args, *f.MinAge)
		clauses = append(clauses, fmt.Sprintf("age_at_diagnosis >= $%d", len(args)))
	}
	if f.MaxAge != nil {
		args = append(args, *f.MaxAge)
		clauses = append(clauses, fmt.Sprintf("age_at_diagnosis <= $%d", len(args)))
	}
	return "SELECT case_id FROM cases WHERE " + strings.Join(clauses, " AND ") + " ORDER BY case_id", args
}

func scanCohorts(rows pgx.Rows) ([]models.Cohort, error) {
	var cohorts []models.Cohort
	for rows.Next() {
		var c models.Cohort
		var raw []byte
		if err := rows.Scan(&c.CohortID, &c.Name, &c.Description, &raw, &c.CaseCount, &c.CreatedAt); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(raw, &c.Filters); err != nil {
			return nil, err
		}
		cohorts = append(cohorts, c)
	}
	return cohorts, rows.Err()
}
