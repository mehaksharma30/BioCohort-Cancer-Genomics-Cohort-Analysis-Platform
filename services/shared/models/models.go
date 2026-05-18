package models

import "time"

type Project struct {
	ProjectID   string    `json:"project_id"`
	Name        string    `json:"name"`
	DiseaseType string    `json:"disease_type"`
	PrimarySite string    `json:"primary_site"`
	CreatedAt   time.Time `json:"created_at"`
}

type Case struct {
	CaseID             string    `json:"case_id"`
	ProjectID          string    `json:"project_id"`
	SubmitterID        string    `json:"submitter_id"`
	PrimarySite        string    `json:"primary_site"`
	DiseaseType        string    `json:"disease_type"`
	Gender             *string   `json:"gender"`
	AgeAtDiagnosis     *int      `json:"age_at_diagnosis"`
	VitalStatus        *string   `json:"vital_status"`
	DaysToDeath        *int      `json:"days_to_death"`
	DaysToLastFollowUp *int      `json:"days_to_last_follow_up"`
	CreatedAt          time.Time `json:"created_at"`
}

type CohortFilters struct {
	ProjectID   string `json:"project_id,omitempty"`
	PrimarySite string `json:"primary_site,omitempty"`
	DiseaseType string `json:"disease_type,omitempty"`
	Gender      string `json:"gender,omitempty"`
	VitalStatus string `json:"vital_status,omitempty"`
	MinAge      *int   `json:"min_age,omitempty"`
	MaxAge      *int   `json:"max_age,omitempty"`
}

type Cohort struct {
	CohortID    string        `json:"cohort_id"`
	Name        string        `json:"name"`
	Description string        `json:"description"`
	Filters     CohortFilters `json:"filters"`
	CaseCount   int           `json:"case_count"`
	CreatedAt   time.Time     `json:"created_at"`
}

type IngestionJob struct {
	JobID           string     `json:"job_id"`
	Source          string     `json:"source"`
	Status          string     `json:"status"`
	RecordsFetched  int        `json:"records_fetched"`
	RecordsInserted int        `json:"records_inserted"`
	RawObjectKey    *string    `json:"raw_object_key"`
	ErrorMessage    *string    `json:"error_message"`
	StartedAt       time.Time  `json:"started_at"`
	CompletedAt     *time.Time `json:"completed_at"`
}
