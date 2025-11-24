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

// NewDB создает новое подключение к базе данных в зависимости от типа
func NewDB(cfg *config.DatabaseConfig) (*gorm.DB, error) {
	switch cfg.Type {
	case "sqlite":
		return NewSQLiteDB(cfg)
	case "postgres", "":
		return NewPostgresDB(cfg)
	default:
		return nil, fmt.Errorf("неизвестный тип базы данных: %s", cfg.Type)
	}
}

// NewPostgresDB создает новое подключение к PostgreSQL
func NewPostgresDB(cfg *config.DatabaseConfig) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName, cfg.SSLMode,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("не удалось подключиться к базе данных: %w", err)
	}

	return db, nil
}

// NewSQLiteDB создает новое подключение к SQLite
func NewSQLiteDB(cfg *config.DatabaseConfig) (*gorm.DB, error) {
	dbName := cfg.DBName
	if dbName == "" {
		dbName = "library.db" // значение по умолчанию
	}

	db, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
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
