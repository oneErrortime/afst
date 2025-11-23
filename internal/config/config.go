package config

import (
	"os"
	"time"

	"github.com/joho/godotenv"
)

// Config содержит настройки приложения
type Config struct {
	// Настройки сервера
	Port    string
	GinMode string

	// Настройки базы данных
	Database DatabaseConfig

	// Настройки JWT
	JWT JWTConfig

	// Логирование
	LogLevel string
}

// DatabaseConfig содержит настройки подключения к БД
type DatabaseConfig struct {
	SQLitePath string
}

// JWTConfig содержит настройки JWT
type JWTConfig struct {
	Secret    string
	ExpiresIn time.Duration
}

// Load загружает конфигурацию из переменных окружения
func Load() (*Config, error) {
	// Загружаем .env файл (игнорируем ошибку, если файла нет)
	_ = godotenv.Load()

	// Парсим время истечения JWT
	jwtExpiresStr := getEnvOrDefault("JWT_EXPIRES_IN", "24h")
	jwtExpires, err := time.ParseDuration(jwtExpiresStr)
	if err != nil {
		jwtExpires = 24 * time.Hour
	}

	dbSQLitePath := getEnvOrDefault("DB_SQLITE_PATH", "file:library.db?_foreign_keys=on&_busy_timeout=5000")

	config := &Config{
		Port:    getEnvOrDefault("PORT", "8080"),
		GinMode: getEnvOrDefault("GIN_MODE", "debug"),

		Database: DatabaseConfig{
			SQLitePath: dbSQLitePath,
		},

		JWT: JWTConfig{
			Secret:    getEnvOrDefault("JWT_SECRET", "your-super-secret-jwt-key"),
			ExpiresIn: jwtExpires,
		},

		LogLevel: getEnvOrDefault("LOG_LEVEL", "debug"),
	}

	return config, nil
}

// getEnvOrDefault возвращает значение переменной окружения или значение по умолчанию
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
