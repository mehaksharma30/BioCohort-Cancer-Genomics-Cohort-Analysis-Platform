package main

import "testing"

func TestParseLimit(t *testing.T) {
	if got := parseLimit("25", 100); got != 25 {
		t.Fatalf("expected 25, got %d", got)
	}
	if got := parseLimit("9999", 100); got != 100 {
		t.Fatalf("expected fallback, got %d", got)
	}
}

func TestGDCDecimalClinicalFieldsParseAndConvert(t *testing.T) {
	raw := []byte(`{
		"data": {
			"hits": [
				{
					"case_id": "abc",
					"submitter_id": "TCGA-XX",
					"project": {
						"project_id": "TCGA-BRCA",
						"name": "Breast Cancer"
					},
					"disease_type": "Breast Invasive Carcinoma",
					"primary_site": "Breast",
					"demographic": {
						"gender": "female"
					},
					"diagnoses": [
						{
							"age_at_diagnosis": 12045.0,
							"vital_status": "Alive",
							"days_to_death": null,
							"days_to_last_follow_up": 24.0
						}
					],
					"samples": []
				}
			]
		}
	}`)

	parsed, err := parseGDCResponse(raw)
	if err != nil {
		t.Fatalf("expected GDC response to parse: %v", err)
	}
	if len(parsed.Data.Hits) != 1 {
		t.Fatalf("expected 1 hit, got %d", len(parsed.Data.Hits))
	}

	diagnosis := firstDiagnosis(parsed.Data.Hits[0])
	if !diagnosis.age.Valid || diagnosis.age.Int64 != 12045 {
		t.Fatalf("expected age_at_diagnosis 12045, got %+v", diagnosis.age)
	}
	if diagnosis.death.Valid {
		t.Fatalf("expected days_to_death to remain null, got %+v", diagnosis.death)
	}
	if !diagnosis.followUp.Valid || diagnosis.followUp.Int64 != 24 {
		t.Fatalf("expected days_to_last_follow_up 24, got %+v", diagnosis.followUp)
	}
}
