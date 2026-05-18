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
