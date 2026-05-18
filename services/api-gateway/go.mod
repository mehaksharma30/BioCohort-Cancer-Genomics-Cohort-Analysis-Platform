module biocohort/api-gateway

go 1.22

require (
	biocohort/shared v0.0.0
	github.com/go-chi/chi/v5 v5.0.12
)

require github.com/go-chi/cors v1.2.1 // indirect

replace biocohort/shared => ../shared
