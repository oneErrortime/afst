package repository

import (
	"fmt"

	"github.com/oneErrortime/afst/internal/config"
	"github.com/oneErrortime/afst/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// NewDatabase создает новое подключение к базе данных в зависимости от движка
func NewDatabase(cfg *config.DatabaseConfig) (*gorm.DB, error) {
	logMode := logger.Default.LogMode(logger.Info)

	switch cfg.Engine {
	case "sqlite":
		path := cfg.SQLitePath
		if path == "" {
			path = "file:library.db?_foreign_keys=on&_busy_timeout=5000"
		}

		db, err := gorm.Open(sqlite.Open(path), &gorm.Config{
			Logger: logMode,
		})
		if err != nil {
			return nil, fmt.Errorf("не удалось подключиться к sqlite базе данных: %w", err)
		}

		return db, nil

	default:
		dsn := cfg.DSN
		if dsn == "" {
			dsn = fmt.Sprintf(
				"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
				cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName, cfg.SSLMode,
			)
		}

		db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
			Logger: logMode,
		})
		if err != nil {
			return nil, fmt.Errorf("не удалось подключиться к базе данных: %w", err)
		}

		return db, nil
	}
}

// Migrate выполняет автоматическую миграцию моделей
func Migrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&models.User{},
		&models.Book{},
		&models.Reader{},
		&models.BorrowedBook{},
	)
}
