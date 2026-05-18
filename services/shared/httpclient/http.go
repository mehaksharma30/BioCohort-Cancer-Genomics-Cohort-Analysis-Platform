package httpclient

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

type ErrorResponse struct {
	Error string `json:"error"`
}

func Middleware() []func(http.Handler) http.Handler {
	return []func(http.Handler) http.Handler{
		middleware.RequestID,
		middleware.RealIP,
		func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				start := time.Now()
				next.ServeHTTP(w, r)
				log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start).Round(time.Millisecond))
			})
		},
		cors.Handler(cors.Options{
			AllowedOrigins:   []string{"http://localhost:5173", "http://127.0.0.1:5173"},
			AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
			AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
			AllowCredentials: false,
			MaxAge:           300,
		}),
	}
}

func JSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Printf("encode response: %v", err)
	}
}

func Error(w http.ResponseWriter, status int, err error) {
	JSON(w, status, ErrorResponse{Error: err.Error()})
}

func Health(w http.ResponseWriter, _ *http.Request) {
	JSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
