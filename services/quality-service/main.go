package main

import (
	"context"
	"encoding/json"
	"log"
	"math"
	"net/http"
	"time"

	"biocohort/shared/config"
	"biocohort/shared/db"
	"biocohort/shared/httpclient"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type service struct{ db *pgxpool.Pool }

type report struct {
	ReportID                string         `json:"report_id"`
	CohortID                string         `json:"cohort_id"`
	QualityScore            float64        `json:"quality_score"`
	TotalRecords            int            `json:"total_records"`
	MissingAgeCount         int            `json:"missing_age_count"`
	MissingGenderCount      int            `json:"missing_gender_count"`
	MissingVitalStatusCount int            `json:"missing_vital_status_count"`
	DuplicateCaseCount      int            `json:"duplicate_case_count"`
	InvalidAgeCount         int            `json:"invalid_age_count"`
	MissingFields           map[string]int `json:"missing_fields"`
	GeneratedAt             time.Time      `json:"generated_at"`
}

func main() {
	cfg := config.Load("8084")
	pool, err := db.Connect(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("quality-service database startup failed: %v", err)
	}
	s := &service{db: pool}
	r := chi.NewRouter()
	for _, mw := range httpclient.Middleware() {
		r.Use(mw)
	}
	r.Get("/health", httpclient.Health)
	r.Post("/cohorts/{id}/quality-report", s.createReport)
	r.Get("/cohorts/{id}/quality-report", s.getReport)
	log.Printf("quality-service listening on :%s", cfg.Port)
	log.Fatal(http.ListenAndServe("0.0.0.0:"+cfg.Port, r))
}

func (s *service) createReport(w http.ResponseWriter, r *http.Request) {
	cohortID := chi.URLParam(r, "id")
	total, missingAge, missingGender, missingVital, invalidAge, err := s.metrics(r.Context(), cohortID)
	if err != nil {
		httpclient.Error(w, 500, err)
		return
	}
	duplicates := 0
	score := calculateQualityScore(total, missingAge, missingGender, missingVital, invalidAge, duplicates)
	missing := map[string]int{"age_at_diagnosis": missingAge, "gender": missingGender, "vital_status": missingVital}
	missingJSON, _ := json.Marshal(missing)
	reportID := uuid.New().String()
	var generated time.Time
	err = s.db.QueryRow(r.Context(), `INSERT INTO quality_reports (report_id, cohort_id, quality_score, total_records, missing_age_count, missing_gender_count, missing_vital_status_count, duplicate_case_count, invalid_age_count, missing_fields)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING generated_at`,
		reportID, cohortID, score, total, missingAge, missingGender, missingVital, duplicates, invalidAge, missingJSON).Scan(&generated)
	if err != nil {
		httpclient.Error(w, 500, err)
		return
	}
	httpclient.JSON(w, 201, report{ReportID: reportID, CohortID: cohortID, QualityScore: score, TotalRecords: total, MissingAgeCount: missingAge, MissingGenderCount: missingGender, MissingVitalStatusCount: missingVital, DuplicateCaseCount: duplicates, InvalidAgeCount: invalidAge, MissingFields: missing, GeneratedAt: generated})
}

func (s *service) getReport(w http.ResponseWriter, r *http.Request) {
	rep, err := s.latestReport(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		status := 500
		if err == pgx.ErrNoRows {
			status = 404
		}
		httpclient.Error(w, status, err)
		return
	}
	httpclient.JSON(w, 200, rep)
}

func (s *service) metrics(ctx context.Context, cohortID string) (total, missingAge, missingGender, missingVital, invalidAge int, err error) {
	err = s.db.QueryRow(ctx, `SELECT
		COUNT(*),
		COUNT(*) FILTER (WHERE c.age_at_diagnosis IS NULL),
		COUNT(*) FILTER (WHERE c.gender IS NULL OR c.gender=''),
		COUNT(*) FILTER (WHERE c.vital_status IS NULL OR c.vital_status=''),
		COUNT(*) FILTER (WHERE c.age_at_diagnosis < 0 OR c.age_at_diagnosis > 120)
		FROM cases c JOIN cohort_cases cc ON cc.case_id=c.case_id WHERE cc.cohort_id=$1`, cohortID).
		Scan(&total, &missingAge, &missingGender, &missingVital, &invalidAge)
	return
}

func (s *service) latestReport(ctx context.Context, cohortID string) (report, error) {
	var rep report
	var missing []byte
	err := s.db.QueryRow(ctx, `SELECT report_id::text, cohort_id::text, quality_score, total_records, missing_age_count, missing_gender_count, missing_vital_status_count, duplicate_case_count, invalid_age_count, missing_fields, generated_at
		FROM quality_reports WHERE cohort_id=$1 ORDER BY generated_at DESC LIMIT 1`, cohortID).
		Scan(&rep.ReportID, &rep.CohortID, &rep.QualityScore, &rep.TotalRecords, &rep.MissingAgeCount, &rep.MissingGenderCount, &rep.MissingVitalStatusCount, &rep.DuplicateCaseCount, &rep.InvalidAgeCount, &missing, &rep.GeneratedAt)
	if err != nil {
		return rep, err
	}
	_ = json.Unmarshal(missing, &rep.MissingFields)
	return rep, nil
}

func calculateQualityScore(total, missingAge, missingGender, missingVital, invalidAge, duplicates int) float64 {
	if total <= 0 {
		return 100
	}
	t := float64(total)
	score := 100 -
		(float64(missingAge)/t)*20 -
		(float64(missingGender)/t)*15 -
		(float64(missingVital)/t)*15 -
		(float64(invalidAge)/t)*25 -
		(float64(duplicates)/t)*25
	return math.Max(0, math.Min(100, math.Round(score*10)/10))
}
