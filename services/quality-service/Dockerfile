FROM golang:1.22-alpine AS build
WORKDIR /src
COPY services/shared ./services/shared
COPY services/quality-service ./services/quality-service
WORKDIR /src/services/quality-service
RUN go mod download && go build -o /out/quality-service .

FROM alpine:3.20
RUN adduser -D appuser
USER appuser
COPY --from=build /out/quality-service /quality-service
EXPOSE 8084
ENTRYPOINT ["/quality-service"]
