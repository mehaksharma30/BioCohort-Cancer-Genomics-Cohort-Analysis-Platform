FROM golang:1.22-alpine AS build
WORKDIR /src
COPY services/shared ./services/shared
COPY services/api-gateway ./services/api-gateway
WORKDIR /src/services/api-gateway
RUN go mod download && go build -o /out/api-gateway .

FROM alpine:3.20
RUN adduser -D appuser
USER appuser
COPY --from=build /out/api-gateway /api-gateway
EXPOSE 8080
ENTRYPOINT ["/api-gateway"]
