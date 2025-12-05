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
func Migrate(db *gorm.DB) e		defaultModels := []interface{}{
			&models.UserGroup{},
			&models.User{},
			&models.Category{},
			&models.Book{},
			&models.BookFile{},
			&models.Subscription{},
			&models.BookAccess{},
			&models.ReadingSession{},
			&models.Reader{},
			&models.BorrowedBook{},
			&models.Permission{},
			&models.Role{},
			&models.RolePermission{},
			&models.UserRole{},
		}r(s string) *string {
	return &s
}

	func SeedDefaultData(db *gorm.DB) error {
		var groupCount int64
		db.Model(&models.UserGroup{}).Count(&groupCount)
		if groupCount == 0 {
			groups := []models.UserGroup{
				{Name: "Свободные читатели", Type: models.GroupTypeFree, Description: strPtr("Обычные пользователи библиотеки"), Color: strPtr("#3B82F6"), MaxBooks: 3, LoanDays: 14, CanDownload: false, IsActive: true},
				{Name: "Студенты", Type: models.GroupTypeStudent, Description: strPtr("Студенты учебных заведений"), Color: strPtr("#10B981"), MaxBooks: 5, LoanDays: 30, CanDownload: true, IsActive: true},
				{Name: "Подписчики", Type: models.GroupTypeSubscriber, Description: strPtr("Премиум подписчики"), Color: strPtr("#8B5CF6"), MaxBooks: 10, LoanDays: 60, CanDownload: true, IsActive: true},
			}
			for _, g := range groups {
				db.Create(&g)
			}
		}
	
		var catCount int64
		db.Model(&models.Category{}).Count(&catCount)
		if catCount == 0 {
			categories := []models.Category{
				{Name: "Художественная литература", Slug: "fiction", Description: strPtr("Романы, повести, рассказы"), Color: strPtr("#EF4444"), Icon: strPtr("📚"), SortOrder: 1, IsActive: true},
				{Name: "Научная литература", Slug: "science", Description: strPtr("Научные труды и исследования"), Color: strPtr("#3B82F6"), Icon: strPtr("🔬"), SortOrder: 2, IsActive: true},
				{Name: "Учебники", Slug: "textbooks", Description: strPtr("Учебные материалы"), Color: strPtr("#10B981"), Icon: strPtr("📖"), SortOrder: 3, IsActive: true},
				{Name: "Программирование", Slug: "programming", Description: strPtr("Книги по программированию"), Color: strPtr("#8B5CF6"), Icon: strPtr("💻"), SortOrder: 4, IsActive: true},
				{Name: "Бизнес", Slug: "business", Description: strPtr("Бизнес литература"), Color: strPtr("#F59E0B"), Icon: strPtr("💼"), SortOrder: 5, IsActive: true},
			}
			for _, c := range categories {
				db.Create(&c)
			}
		}
		
		// Добавление начальных данных для RBAC
		var roleCount int64
		db.Model(&models.Role{}).Count(&roleCount)
		if roleCount == 0 {
			// 1. Создание прав (Permissions)
			permissions := []models.Permission{
				{Name: "books.view", Description: "Просмотр каталога книг"},
				{Name: "books.create", Description: "Добавление новых книг"},
				{Name: "books.edit", Description: "Редактирование книг"},
				{Name: "users.view", Description: "Просмотр списка пользователей"},
				{Name: "users.edit", Description: "Редактирование профилей пользователей"},
				{Name: "lending.borrow", Description: "Выдача книг"},
				{Name: "lending.return", Description: "Прием книг"},
				{Name: "system.admin", Description: "Полный административный доступ"},
			}
			for i := range permissions {
				db.Create(&permissions[i])
			}
			
			// 2. Создание ролей (Roles)
			adminRole := models.Role{Name: "admin", Description: "Администратор системы", IsSystem: true}
			librarianRole := models.Role{Name: "librarian", Description: "Библиотекарь", IsSystem: true}
			readerRole := models.Role{Name: "reader", Description: "Обычный читатель", IsSystem: true}
			
			db.Create(&adminRole)
			db.Create(&librarianRole)
			db.Create(&readerRole)
			
			// 3. Назначение прав ролям
			// Admin получает все права
			for _, p := range permissions {
				db.Model(&adminRole).Association("Permissions").Append(&p)
			}
			
			// Librarian получает права на управление книгами и выдачей
			for _, p := range permissions {
				if p.Name == "books.create" || p.Name == "books.edit" || p.Name == "lending.borrow" || p.Name == "lending.return" || p.Name == "books.view" {
					db.Model(&librarianRole).Association("Permissions").Append(&p)
				}
			}
			
			// Reader получает только право на просмотр
			for _, p := range permissions {
				if p.Name == "books.view" {
					db.Model(&readerRole).Association("Permissions").Append(&p)
				}
			}
		}
	
		return nil
	}
