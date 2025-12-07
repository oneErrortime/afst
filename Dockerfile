FROM golang:1.24-alpine AS builder

RUN apk add --no-cache git

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/server

FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata

RUN adduser -D -s /bin/sh appuser

WORKDIR /app

COPY --from=builder /app/main .
COPY --from=builder /app/migrations ./migrations

RUN mkdir -p /var/data/uploads && \
    chown -R appuser:appuser /app /var/data

USER appuser

EXPOSE 8080

ENV FILE_STORAGE_PATH=/var/data/uploads
ENV DB_SQLITE_PATH=/var/data/library.db

CMD ["./main"]
