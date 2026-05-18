package main

import "testing"

func TestCalculateQualityScore(t *testing.T) {
	score := calculateQualityScore(10, 1, 1, 0, 1, 0)
	if score != 94.0 {
		t.Fatalf("expected 94.0, got %.1f", score)
	}
	if got := calculateQualityScore(0, 0, 0, 0, 0, 0); got != 100 {
		t.Fatalf("expected empty cohort score 100, got %.1f", got)
	}
}
