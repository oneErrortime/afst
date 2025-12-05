package gorm_test

import (
	"testing"

	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository/gorm"
	"github.com/stretchr/testify/assert"
)

func TestRoleRepository(t *testing.T) {
	db := setupRBACDB(t)
	roleRepo := gorm.NewRoleRepository(db)
	permRepo := gorm.NewPermissionRepository(db)

	// Создание прав
	perm1 := &models.Permission{Name: "books.view"}
	perm2 := &models.Permission{Name: "books.create"}
	permRepo.Create(perm1)
	permRepo.Create(perm2)

	// 1. Создание роли
	role1 := &models.Role{Name: "librarian", Description: "Библиотекарь", IsSystem: true}
	err := roleRepo.Create(role1)
	assert.NoError(t, err)
	assert.NotEqual(t, models.Role{}, role1.ID)

	// 2. Получение по имени
	foundRole, err := roleRepo.GetByName("librarian")
	assert.NoError(t, err)
	assert.Equal(t, role1.Name, foundRole.Name)

	// 3. Добавление права к роли
	err = roleRepo.AddPermission(role1.ID, perm1.ID)
	assert.NoError(t, err)
	
	// 4. Проверка прав роли
	perms, err := roleRepo.GetPermissionsForRole(role1.ID)
	assert.NoError(t, err)
	assert.Len(t, perms, 1)
	assert.Equal(t, perm1.Name, perms[0].Name)
	
	// 5. Добавление второго права
	err = roleRepo.AddPermission(role1.ID, perm2.ID)
	assert.NoError(t, err)
	
	perms, err = roleRepo.GetPermissionsForRole(role1.ID)
	assert.NoError(t, err)
	assert.Len(t, perms, 2)
	
	// 6. Удаление права
	err = roleRepo.RemovePermission(role1.ID, perm1.ID)
	assert.NoError(t, err)
	
	perms, err = roleRepo.GetPermissionsForRole(role1.ID)
	assert.NoError(t, err)
	assert.Len(t, perms, 1)
	assert.Equal(t, perm2.Name, perms[0].Name)
	
	// 7. Получение всех ролей
	allRoles, err := roleRepo.GetAll()
	assert.NoError(t, err)
	assert.Len(t, allRoles, 1)
}
