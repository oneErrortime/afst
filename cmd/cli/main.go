package main

import (
	"fmt"
	"log"
	"os"

	"github.com/oneErrortime/afst/internal/auth"
	"github.com/oneErrortime/afst/internal/config"
	"github.com/oneErrortime/afst/internal/repository"
	"github.com/oneErrortime/afst/internal/repository/gorm"
	"github.com/oneErrortime/afst/internal/services"
)

func main() {
	if len(os.Args) < 3 {
		fmt.Println("Использование: go run ./cmd/cli <email> <password>")
		os.Exit(1)
	}

	email := os.Args[1]
	password := os.Args[2]

	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Ошибка загрузки конфигурации:", err)
	}

	db, err := repository.NewDatabase(&cfg.Database)
	if err != nil {
		log.Fatal("Ошибка подключения к базе данных:", err)
	}

	repos := gorm.NewExtendedRepository(db)
	jwtService := auth.NewJWTService(cfg.JWT.Secret, cfg.JWT.ExpiresIn)
	authService := services.NewAuthService(repos.User, repos.UserGroup, jwtService)

	user, err := authService.CreateAdmin(email, password, "Admin")
	if err != nil {
		log.Fatalf("Ошибка создания администратора: %v", err)
	}

	fmt.Printf("Администратор '%s' успешно создан с ID: %s\n", user.Email, user.ID)
}
