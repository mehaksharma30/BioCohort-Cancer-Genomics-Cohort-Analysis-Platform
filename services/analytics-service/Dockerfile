FROM golang:1.22-alpine AS build
WORKDIR /src
COPY services/shared ./services/shared
COPY services/analytics-service ./services/analytics-service
WORKDIR /src/services/analytics-service
RUN go mod download && go build -o /out/analytics-service .

FROM alpine:3.20
RUN adduser -D appuser
USER appuser
COPY --from=build /out/analytics-service /analytics-service
EXPOSE 8083
ENTRYPOINT ["/analytics-service"]
