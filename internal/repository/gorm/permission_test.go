package gorm_test

import (
	"testing"

	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository/gorm"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupRBACDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	assert.NoError(t, err)
	
	err = db.AutoMigrate(&models.Permission{}, &models.Role{}, &models.RolePermission{}, &models.User{}, &models.UserRole{})
	assert.NoError(t, err)
	
	return db
}

func TestPermissionRepository(t *testing.T) {
	db := setupRBACDB(t)
	repo := gorm.NewPermissionRepository(db)

	// 1. Создание права
	perm1 := &models.Permission{
		Name:        "books.create",
		Description: "Создание новых книг",
	}
	err := repo.Create(perm1)
	assert.NoError(t, err)
	assert.NotEqual(t, models.Permission{}, perm1.ID)

	// 2. Получение по имени
	foundPerm, err := repo.GetByName("books.create")
	assert.NoError(t, err)
	assert.Equal(t, perm1.Name, foundPerm.Name)

	// 3. Получение по ID
	foundPermByID, err := repo.GetByID(perm1.ID)
	assert.NoError(t, err)
	assert.Equal(t, perm1.Name, foundPermByID.Name)

	// 4. Создание второго права
	perm2 := &models.Permission{
		Name:        "users.view",
		Description: "Просмотр пользователей",
	}
	err = repo.Create(perm2)
	assert.NoError(t, err)

	// 5. Получение всех прав
	allPerms, err := repo.GetAll()
	assert.NoError(t, err)
	assert.Len(t, allPerms, 2)
	
	// 6. Получение несуществующего
	_, err = repo.GetByName("non_existent")
	assert.Error(t, err)
	assert.Equal(t, gorm.ErrRecordNotFound, err)
}
