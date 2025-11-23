package repository

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/oneErrortime/afst/internal/config"
	"github.com/oneErrortime/afst/internal/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func ensureSQLiteFile(path string) error {
	if path == "" || path == ":memory:" || strings.HasPrefix(path, "file::memory:") {
		return nil
	}

	diskPath := path
	if strings.HasPrefix(diskPath, "file:") {
		diskPath = strings.TrimPrefix(diskPath, "file:")
	}
	if idx := strings.Index(diskPath, "?"); idx != -1 {
		diskPath = diskPath[:idx]
	}
	if diskPath == "" || diskPath == ":memory:" {
		return nil
	}

	diskPath = filepath.Clean(diskPath)
	if dir := filepath.Dir(diskPath); dir != "." && dir != "" {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return fmt.Errorf("не удалось создать директорию для sqlite: %w", err)
		}
	}

	if _, err := os.Stat(diskPath); os.IsNotExist(err) {
		file, err := os.OpenFile(diskPath, os.O_CREATE|os.O_RDWR, 0o600)
		if err != nil {
			return fmt.Errorf("не удалось создать файл sqlite: %w", err)
		}
		if err := file.Close(); err != nil {
			return fmt.Errorf("не удалось закрыть файл sqlite: %w", err)
		}
	}

	return nil
}

func buildSQLiteDSN(path string) string {
	if path == "" {
		path = "library.db"
	}

	if path == ":memory:" || strings.HasPrefix(path, "file::memory:") {
		return path
	}

	dsn := path
	if !strings.HasPrefix(dsn, "file:") {
		dsn = fmt.Sprintf("file:%s", dsn)
	}
	if !strings.Contains(dsn, "?") {
		dsn = dsn + "?_foreign_keys=on&_busy_timeout=5000"
	}

	return dsn
}

// NewDatabase создает новое подключение к базе данных (SQLite)
func NewDatabase(cfg *config.DatabaseConfig) (*gorm.DB, error) {
	logMode := logger.Default.LogMode(logger.Info)

	path := cfg.SQLitePath
	if path == "" {
		path = "library.db"
	}

	if err := ensureSQLiteFile(path); err != nil {
		return nil, err
	}

	dsn := buildSQLiteDSN(path)

	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{
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
