package config

import (
	"os"
	"strconv"
	"strings"
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
	Engine     string
	DSN        string
	Host       string
	Port       int
	User       string
	Password   string
	DBName     string
	SSLMode    string
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

	// Парсим порт базы данных
	dbPort, err := strconv.Atoi(getEnvOrDefault("DB_PORT", "5432"))
	if err != nil {
		dbPort = 5432
	}

	// Парсим время истечения JWT
	jwtExpiresStr := getEnvOrDefault("JWT_EXPIRES_IN", "24h")
	jwtExpires, err := time.ParseDuration(jwtExpiresStr)
	if err != nil {
		jwtExpires = 24 * time.Hour
	}

	dbEngine := strings.ToLower(getEnvOrDefault("DB_ENGINE", "postgres"))
	dbDSN := getEnvOrDefault("DB_DSN", "")
	dbSQLitePath := getEnvOrDefault("DB_SQLITE_PATH", "file:library.db?_foreign_keys=on&_busy_timeout=5000")

	config := &Config{
		Port:    getEnvOrDefault("PORT", "8080"),
		GinMode: getEnvOrDefault("GIN_MODE", "debug"),

		Database: DatabaseConfig{
			Engine:     dbEngine,
			DSN:        dbDSN,
			Host:       getEnvOrDefault("DB_HOST", "localhost"),
			Port:       dbPort,
			User:       getEnvOrDefault("DB_USER", "library_user"),
			Password:   getEnvOrDefault("DB_PASSWORD", "library_password"),
			DBName:     getEnvOrDefault("DB_NAME", "library_db"),
			SSLMode:    getEnvOrDefault("DB_SSLMODE", "disable"),
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
