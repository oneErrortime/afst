package main

import (
	"log"
	"os"

	"github.com/oneErrortime/afst/internal/config"
	"github.com/oneErrortime/afst/internal/repository"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func main() {
	// Проверяем, что файл базы данных не существует
	if _, err := os.Stat("test.db"); err == nil {
		log.Println("test.db уже существует, пропускаем инициализацию")
		return
	}

	// Создаем конфигурацию для SQLite
	cfg := &config.DatabaseConfig{
		Type:   "sqlite",
		DBName: "test.db",
	}

	// Подключаемся к SQLite базе данных
	db, err := gorm.Open(sqlite.Open(cfg.DBName), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatal("Ошибка подключения к базе данных:", err)
	}

	// Выполняем миграции
	if err := repository.Migrate(db); err != nil {
		log.Fatal("Ошибка выполнения миграций:", err)
	}

	log.Println("База данных test.db успешно инициализирована")
}