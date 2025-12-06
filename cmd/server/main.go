package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/oneErrortime/afst/internal/auth"
	"github.com/oneErrortime/afst/internal/config"
	"github.com/oneErrortime/afst/internal/handlers"
	"github.com/oneErrortime/afst/internal/repository"
	"github.com/oneErrortime/afst/internal/repository/gorm"
	"github.com/oneErrortime/afst/internal/services"
	"github.com/oneErrortime/afst/internal/storage"

	_ "github.com/oneErrortime/afst/docs"
)

// @title						Digital Library API
// @version					2.0
// @description				API for a digital library application, providing functionalities for book management, user authentication, and reading features.
// @termsOfService				http://swagger.io/terms/
// @contact.name				API Support
// @contact.url				http://www.swagger.io/support
// @contact.email				support@swagger.io
// @license.name				MIT
// @license.url				https://opensource.org/licenses/MIT
// @host						localhost:8080
// @BasePath					/api/v1
// @securityDefinitions.apiKey	BearerAuth
// @in							header
// @name						Authorization
// @description				Type "Bearer" followed by a space and a JWT token.
func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Ошибка загрузки конфигурации:", err)
	}

	gin.SetMode(cfg.GinMode)

	db, err := repository.NewDatabase(&cfg.Database)
	if err != nil {
		log.Fatal("Ошибка подключения к базе данных:", err)
	}

	if err := repository.Migrate(db); err != nil {
		log.Fatal("Ошибка выполнения миграций:", err)
	}

	if err := repository.SeedDefaultData(db); err != nil {
		log.Println("Предупреждение: не удалось создать начальные данные:", err)
	}

	repos := gorm.NewExtendedRepository(db)

	jwtService := auth.NewJWTService(cfg.JWT.Secret, cfg.JWT.ExpiresIn)

	storagePath := os.Getenv("FILE_STORAGE_PATH")
	if storagePath == "" {
		storagePath = "./uploads"
	}
	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		baseURL = fmt.Sprintf("http://localhost:%s", cfg.Port)
	}
	fileStorage := storage.NewLocalStorage(storagePath, baseURL)

	svc := services.NewExtendedServices(repos, jwtService, fileStorage)

	svc.FeatureFlag.StartCacheUpdate(5 * time.Minute)

	v := validator.New()

	handlersInstance := handlers.NewExtendedHandlers(svc, fileStorage, v)

	router := handlers.SetupRoutes(handlersInstance, jwtService)

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Сервер Library API v2.0 запущен на порту %s", cfg.Port)
	log.Printf("Health check: http://localhost:%s/health", cfg.Port)
	log.Printf("Хранилище файлов: %s", storagePath)

	if err := router.Run(addr); err != nil {
		log.Fatal("Ошибка запуска сервера:", err)
	}
}
