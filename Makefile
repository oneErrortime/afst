# Переменные
BINARY_NAME=library-api
DOCKER_IMAGE=library-api:latest
DOCKER_COMPOSE_FILE=docker-compose.yml

# Команды Go
.PHONY: build
build: ## Собрать приложение
	@echo "Сборка приложения..."
	go build -o bin/$(BINARY_NAME) ./cmd/server

.PHONY: run
run: ## Запустить приложение локально
	@echo "Запуск приложения..."
	go run ./cmd/server

.PHONY: test
test: ## Запустить тесты
	@echo "Запуск тестов..."
	go test -v -race -timeout 30s ./...

.PHONY: test-coverage
test-coverage: ## Запустить тесты с покрытием
	@echo "Запуск тестов с покрытием..."
	go test -v -race -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out

.PHONY: lint
lint: ## Запустить линтер
	@echo "Запуск линтера..."
	golangci-lint run

.PHONY: fmt
fmt: ## Форматировать код
	@echo "Форматирование кода..."
	go fmt ./...
	goimports -w .

.PHONY: tidy
tidy: ## Очистка зависимостей
	@echo "Очистка зависимостей..."
	go mod tidy

.PHONY: deps
deps: ## Установка зависимостей
	@echo "Установка зависимостей..."
	go mod download

# Команды Docker
.PHONY: docker-build
docker-build: ## Собрать Docker образ
	@echo "Сборка Docker образа..."
	docker build -t $(DOCKER_IMAGE) .

.PHONY: docker-run
docker-run: ## Запустить через Docker Compose
	@echo "Запуск через Docker Compose..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) up --build

.PHONY: docker-run-bg
docker-run-bg: ## Запустить через Docker Compose в фоне
	@echo "Запуск через Docker Compose в фоне..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) up -d --build

.PHONY: docker-stop
docker-stop: ## Остановить Docker Compose
	@echo "Остановка Docker Compose..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) down

.PHONY: docker-logs
docker-logs: ## Посмотреть логи Docker Compose
	docker-compose -f $(DOCKER_COMPOSE_FILE) logs -f

.PHONY: docker-clean
docker-clean: ## Очистить Docker ресурсы
	@echo "Очистка Docker ресурсов..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) down --volumes --rmi local
	docker system prune -f

# Команды базы данных
.PHONY: db-up
db-up: ## Запустить только базу данных
	@echo "Запуск PostgreSQL..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) up -d postgres

.PHONY: db-down
db-down: ## Остановить базу данных
	@echo "Остановка PostgreSQL..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) stop postgres

.PHONY: db-connect
db-connect: ## Подключиться к базе данных
	@echo "Подключение к PostgreSQL..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) exec postgres psql -U library_user -d library_db

.PHONY: db-reset
db-reset: ## Сбросить базу данных
	@echo "Сброс базы данных..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) down --volumes
	docker-compose -f $(DOCKER_COMPOSE_FILE) up -d postgres

# Команды разработки
.PHONY: dev
dev: ## Запустить в режиме разработки (с hot reload)
	@echo "Режим разработки..."
	air

.PHONY: clean
clean: ## Очистить сгенерированные файлы
	@echo "Очистка..."
	rm -rf bin/
	rm -f coverage.out
	go clean

.PHONY: install-tools
install-tools: ## Установить инструменты разработки
	@echo "Установка инструментов..."

.PHONY: create-admin
create-admin: ## Создать нового администратора (например, make create-admin email=admin@gmail.com password=secret)
	@echo "Создание администратора..."
	@go run ./cmd/cli $(email) $(password)


# Команды API
.PHONY: api-test
api-test: ## Тестирование API эндпоинтов
	@echo "Тестирование API..."
	@if [ -f scripts/api-test.sh ]; then bash scripts/api-test.sh; else echo "API тесты будут добавлены позже"; fi

.PHONY: swagger
swagger: ## Сгенерировать документацию API (Swagger/OpenAPI)
	@echo "Генерация Swagger документации..."
	./bin/swag init -g cmd/server/main.go

.PHONY: help
help: ## Показать помощь
	@echo "Доступные команды:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

.DEFAULT_GOAL := help