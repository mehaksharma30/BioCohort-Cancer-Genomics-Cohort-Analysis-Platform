package main

import (
	"strings"
	"testing"

	"biocohort/shared/models"
)

func TestBuildCaseFilterQuery(t *testing.T) {
	min := 30
	max := 80
	sql, args := buildCaseFilterQuery(models.CohortFilters{ProjectID: "TCGA-BRCA", Gender: "female", MinAge: &min, MaxAge: &max})
	for _, part := range []string{"project_id=$1", "gender=$2", "age_at_diagnosis >= $3", "age_at_diagnosis <= $4"} {
		if !strings.Contains(sql, part) {
			t.Fatalf("expected %q in %s", part, sql)
		}
	}
	if len(args) != 4 {
		t.Fatalf("expected 4 args, got %d", len(args))
	}
}
