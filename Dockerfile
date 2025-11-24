# Используем официальный образ Go 1.23
FROM golang:1.23-alpine AS builder

# Устанавливаем необходимые пакеты
RUN apk add --no-cache git gcc musl-dev

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы go mod и sum для кэширования зависимостей
COPY go.mod go.sum ./

# Загружаем зависимости
RUN go mod download

# Копируем весь исходный код
COPY . .

# Собираем приложение
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/server

# Финальный образ
FROM alpine:latest

# Устанавливаем сертификаты для HTTPS
RUN apk --no-cache add ca-certificates

# Создаем непривилегированного пользователя
RUN adduser -D -s /bin/sh appuser

WORKDIR /root/

# Копируем бинарный файл из builder
COPY --from=builder /app/main .

# Копируем миграции
COPY --from=builder /app/migrations ./migrations

# Меняем права доступа
RUN chown -R appuser:appuser /root/
USER appuser

# Открываем порт
EXPOSE 8080

# Команда запуска
CMD ["./main"]