package main

import (
	"fmt"
	"github.com/oneErrortime/afst/internal/auth"
	"github.com/oneErrortime/afst/internal/config"
	"github.com/oneErrortime/afst/internal/handlers"
	"github.com/oneErrortime/afst/internal/repository"
	"github.com/oneErrortime/afst/internal/repository/gorm"
	"github.com/oneErrortime/afst/internal/services"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

func main() {
	// Загружаем конфигурацию
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Ошибка загрузки конфигурации:", err)
	}

	// Настраиваем режим Gin
	gin.SetMode(cfg.GinMode)

	// Подключаемся к базе данных
	db, err := repository.NewPostgresDB(&cfg.Database)
	if err != nil {
		log.Fatal("Ошибка подключения к базе данных:", err)
	}

	// Выполняем миграции
	if err := repository.Migrate(db); err != nil {
		log.Fatal("Ошибка выполнения миграций:", err)
	}

	// Создаем репозитории
	repos := gorm.NewRepository(db)

	// Создаем JWT сервис
	jwtService := auth.NewJWTService(cfg.JWT.Secret, cfg.JWT.ExpiresIn)

	// Создаем сервисы
	services := services.NewServices(repos, jwtService)

	// Создаем валидатор
	validator := validator.New()

	// Создаем обработчики
	handlersInstance := handlers.NewHandlers(services, validator)

	// Настраиваем роутер
	router := handlers.SetupRoutes(handlersInstance, jwtService)

	// Запускаем сервер
	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Сервер запущен на порту %s", cfg.Port)
	log.Printf("Swagger UI: http://localhost:%s/health", cfg.Port)

	if err := router.Run(addr); err != nil {
		log.Fatal("Ошибка запуска сервера:", err)
	}
}
