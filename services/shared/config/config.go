package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port                string
	DatabaseURL         string
	MinIOEndpoint       string
	MinIOAccessKey      string
	MinIOSecretKey      string
	MinIOBucket         string
	MinIOUseSSL         bool
	IngestionServiceURL string
	CohortServiceURL    string
	AnalyticsServiceURL string
	QualityServiceURL   string
}

func Load(defaultPort string) Config {
	useSSL, _ := strconv.ParseBool(env("MINIO_USE_SSL", "false"))
	return Config{
		Port:                env("PORT", defaultPort),
		DatabaseURL:         env("DATABASE_URL", "postgres://biocohort:biocohort@localhost:5432/biocohort?sslmode=disable"),
		MinIOEndpoint:       env("MINIO_ENDPOINT", "localhost:9000"),
		MinIOAccessKey:      env("MINIO_ACCESS_KEY", "biocohort"),
		MinIOSecretKey:      env("MINIO_SECRET_KEY", "biocohort123"),
		MinIOBucket:         env("MINIO_BUCKET", "raw-ingestion"),
		MinIOUseSSL:         useSSL,
		IngestionServiceURL: env("INGESTION_SERVICE_URL", "http://localhost:8081"),
		CohortServiceURL:    env("COHORT_SERVICE_URL", "http://localhost:8082"),
		AnalyticsServiceURL: env("ANALYTICS_SERVICE_URL", "http://localhost:8083"),
		QualityServiceURL:   env("QUALITY_SERVICE_URL", "http://localhost:8084"),
	}
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
