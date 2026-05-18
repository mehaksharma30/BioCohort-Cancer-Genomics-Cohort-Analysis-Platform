package main

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"biocohort/shared/config"
	"biocohort/shared/httpclient"
	"github.com/go-chi/chi/v5"
)

type gateway struct {
	client    *http.Client
	ingestion string
	cohort    string
	analytics string
	quality   string
}

func main() {
	cfg := config.Load("8080")
	g := &gateway{
		client:    &http.Client{Timeout: 20 * time.Second},
		ingestion: cfg.IngestionServiceURL,
		cohort:    cfg.CohortServiceURL,
		analytics: cfg.AnalyticsServiceURL,
		quality:   cfg.QualityServiceURL,
	}
	r := chi.NewRouter()
	for _, mw := range httpclient.Middleware() {
		r.Use(mw)
	}
	r.Get("/health", httpclient.Health)
	r.Get("/api/projects", g.proxy(g.ingestion, "/projects"))
	r.Get("/api/cancer-types", g.proxy(g.ingestion, "/cancer-types"))
	r.Get("/api/cases", g.proxy(g.ingestion, "/cases"))
	r.Post("/api/ingestion/jobs", g.proxy(g.ingestion, "/ingestion/jobs"))
	r.Get("/api/ingestion/jobs", g.proxy(g.ingestion, "/ingestion/jobs"))
	r.Get("/api/cohorts", g.proxy(g.cohort, "/cohorts"))
	r.Post("/api/cohorts", g.proxy(g.cohort, "/cohorts"))
	r.Get("/api/cohorts/{id}", g.proxyPath(g.cohort, "/cohorts/{id}"))
	r.Get("/api/cohorts/{id}/cases", g.proxyPath(g.cohort, "/cohorts/{id}/cases"))
	r.Get("/api/cohorts/{id}/summary", g.proxyPath(g.analytics, "/cohorts/{id}/summary"))
	r.Get("/api/cohorts/{id}/quality-report", g.proxyPath(g.quality, "/cohorts/{id}/quality-report"))
	r.Post("/api/cohorts/{id}/quality-report", g.proxyPath(g.quality, "/cohorts/{id}/quality-report"))
	r.Get("/api/overview", g.proxy(g.analytics, "/overview"))
	log.Printf("api-gateway listening on :%s", cfg.Port)
	log.Fatal(http.ListenAndServe("0.0.0.0:"+cfg.Port, r))
}

func (g *gateway) proxy(base, path string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		g.forward(w, r, base, path)
	}
}

func (g *gateway) proxyPath(base, template string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := template
		for _, key := range []string{"id"} {
			path = strings.ReplaceAll(path, "{"+key+"}", url.PathEscape(chi.URLParam(r, key)))
		}
		g.forward(w, r, base, path)
	}
}

func (g *gateway) forward(w http.ResponseWriter, r *http.Request, base, path string) {
	target := strings.TrimRight(base, "/") + path
	if r.URL.RawQuery != "" {
		target += "?" + r.URL.RawQuery
	}
	var body io.Reader
	if r.Body != nil {
		buf, err := io.ReadAll(r.Body)
		if err != nil {
			httpclient.Error(w, 400, err)
			return
		}
		body = bytes.NewReader(buf)
	}
	req, err := http.NewRequestWithContext(context.Background(), r.Method, target, body)
	if err != nil {
		httpclient.Error(w, 500, err)
		return
	}
	if ct := r.Header.Get("Content-Type"); ct != "" {
		req.Header.Set("Content-Type", ct)
	}
	resp, err := g.client.Do(req)
	if err != nil {
		httpclient.Error(w, 502, fmt.Errorf("upstream request failed: %w", err))
		return
	}
	defer resp.Body.Close()
	w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
	w.WriteHeader(resp.StatusCode)
	if _, err := io.Copy(w, resp.Body); err != nil {
		log.Printf("proxy response copy failed: %v", err)
	}
}
