FROM golang:1.22-alpine AS build
WORKDIR /src
COPY services/shared ./services/shared
COPY services/ingestion-service ./services/ingestion-service
WORKDIR /src/services/ingestion-service
RUN go mod download && go build -o /out/ingestion-service .

FROM alpine:3.20
RUN adduser -D appuser
USER appuser
COPY --from=build /out/ingestion-service /ingestion-service
EXPOSE 8081
ENTRYPOINT ["/ingestion-service"]
