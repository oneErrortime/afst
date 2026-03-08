package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/oneErrortime/afst/internal/auth"
	"github.com/oneErrortime/afst/internal/config"
	"github.com/oneErrortime/afst/internal/events"
	"github.com/oneErrortime/afst/internal/handlers"
	"github.com/oneErrortime/afst/internal/repository"
	gormrepo "github.com/oneErrortime/afst/internal/repository/gorm"
	"github.com/oneErrortime/afst/internal/services"
	"github.com/oneErrortime/afst/internal/storage"
	"github.com/oneErrortime/afst/internal/worker"

	_ "github.com/oneErrortime/afst/docs"
)

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

	repos := gormrepo.NewExtendedRepository(db)

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

	// ── Event bus ──────────────────────────────────────────────────────────────
	bus := events.Default()

	// Optional NATS bridge (set NATS_URL env to enable)
	natsBridge, err := events.NewNATSBridge(cfg.NatsURL, bus)
	if err != nil {
		log.Printf("Warning: NATS connection failed (%v) — continuing without NATS", err)
	}

	// ── Worker pool ────────────────────────────────────────────────────────────
	// 4 concurrent workers, queue depth 256, up to 3 retries per job
	pool := worker.NewPool("file-processor", 4, 256, 3)

	// ── Services ───────────────────────────────────────────────────────────────
	svc := services.NewExtendedServicesWithWorkers(repos, jwtService, fileStorage, bus, pool)
	svc.FeatureFlag.StartCacheUpdate(5 * time.Minute)

	v := validator.New()
	handlersInstance := handlers.NewExtendedHandlers(svc, fileStorage, v, bus)

	router := handlers.SetupRoutes(handlersInstance, jwtService)

	// ── HTTP server with graceful shutdown ─────────────────────────────────────
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      router,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 120 * time.Second, // longer for SSE and large file transfers
		IdleTimeout:  60 * time.Second,
	}

	// Start in background
	go func() {
		log.Printf("Library API v2.0 → http://localhost:%s", cfg.Port)
		log.Printf("Storage: %s | NATS: %s", storagePath, cfg.NatsURL)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Server error:", err)
		}
	}()

	// Wait for interrupt
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Drain HTTP connections
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("HTTP shutdown error: %v", err)
	}

	// Drain worker pool
	pool.Shutdown(20 * time.Second)

	// Close NATS
	if natsBridge != nil {
		natsBridge.Close()
	}

	log.Println("Server stopped cleanly.")
}
