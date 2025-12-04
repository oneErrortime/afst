package repository

import (
	"fmt"

	"github.com/oneErrortime/afst/internal/config"
	"github.com/oneErrortime/afst/internal/models"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// NewDatabase создает новое подключение к базе данных (SQLite)
// Использует pure-Go драйвер modernc.org/sqlite через glebarez/sqlite
// Не требует CGO, работает с CGO_ENABLED=0 (необходимо для render.com)
func NewDatabase(cfg *config.DatabaseConfig) (*gorm.DB, error) {
	logMode := logger.Default.LogMode(logger.Info)

	path := cfg.SQLitePath
	if path == "" {
		path = "library.db"
	}

	db, err := gorm.Open(sqlite.Open(path), &gorm.Config{
		Logger: logMode,
	})
	if err != nil {
		return nil, fmt.Errorf("не удалось подключиться к sqlite базе данных: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("не удалось получить sql.DB: %w", err)
	}
	sqlDB.Exec("PRAGMA foreign_keys = ON")
	sqlDB.Exec("PRAGMA busy_timeout = 5000")

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
