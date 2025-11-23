package repository

import (
	"fmt"

	"github.com/oneErrortime/afst/internal/config"
	"github.com/oneErrortime/afst/internal/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// NewDatabase создает новое подключение к базе данных (SQLite)
func NewDatabase(cfg *config.DatabaseConfig) (*gorm.DB, error) {
	logMode := logger.Default.LogMode(logger.Info)

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
