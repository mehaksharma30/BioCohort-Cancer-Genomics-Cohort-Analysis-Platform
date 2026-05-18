FROM golang:1.22-alpine AS build
WORKDIR /src
COPY services/shared ./services/shared
COPY services/cohort-service ./services/cohort-service
WORKDIR /src/services/cohort-service
RUN go mod download && go build -o /out/cohort-service .

FROM alpine:3.20
RUN adduser -D appuser
USER appuser
COPY --from=build /out/cohort-service /cohort-service
EXPOSE 8082
ENTRYPOINT ["/cohort-service"]
