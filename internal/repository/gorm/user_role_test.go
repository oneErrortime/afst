package gorm_test

import (
	"testing"

	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository/gorm"
	"github.com/stretchr/testify/assert"
)

func TestUserRoleRepository(t *testing.T) {
	db := setupRBACDB(t)
	userRoleRepo := gorm.NewUserRoleRepository(db)
	roleRepo := gorm.NewRoleRepository(db)
	permRepo := gorm.NewPermissionRepository(db)

	// Создание тестовых данных
	user1 := &models.User{ID: uuid.New(), Email: "user1@test.com", Password: "hashedpassword", Name: "User One"}
	db.Create(user1)
	
	role1 := &models.Role{Name: "admin", IsSystem: true}
	role2 := &models.Role{Name: "reader", IsSystem: true}
	roleRepo.Create(role1)
	roleRepo.Create(role2)
	
	perm1 := &models.Permission{Name: "books.view"}
	perm2 := &models.Permission{Name: "books.create"}
	permRepo.Create(perm1)
	permRepo.Create(perm2)
	
	roleRepo.AddPermission(role1.ID, perm1.ID)
	roleRepo.AddPermission(role1.ID, perm2.ID)
	roleRepo.AddPermission(role2.ID, perm1.ID) // Reader может только просматривать

	// 1. Назначение роли пользователю
	err := userRoleRepo.AssignRole(user1.ID, role1.ID)
	assert.NoError(t, err)

	// 2. Получение ролей пользователя
	roles, err := userRoleRepo.GetRolesForUser(user1.ID)
	assert.NoError(t, err)
	assert.Len(t, roles, 1)
	assert.Equal(t, role1.Name, roles[0].Name)
	
	// 3. Получение прав пользователя
	perms, err := userRoleRepo.GetPermissionsForUser(user1.ID)
	assert.NoError(t, err)
	assert.Len(t, perms, 2)
	
	// 4. Назначение второй роли
	err = userRoleRepo.AssignRole(user1.ID, role2.ID)
	assert.NoError(t, err)
	
	roles, err = userRoleRepo.GetRolesForUser(user1.ID)
	assert.NoError(t, err)
	assert.Len(t, roles, 2)
	
	// 5. Повторное получение прав (должно быть 2 уникальных права)
	perms, err = userRoleRepo.GetPermissionsForUser(user1.ID)
	assert.NoError(t, err)
	assert.Len(t, perms, 2) // books.view (от обеих ролей) и books.create (от admin)
	
	// 6. Отзыв роли
	err = userRoleRepo.RevokeRole(user1.ID, role1.ID)
	assert.NoError(t, err)
	
	roles, err = userRoleRepo.GetRolesForUser(user1.ID)
	assert.NoError(t, err)
	assert.Len(t, roles, 1)
	assert.Equal(t, role2.Name, roles[0].Name)
	
	// 7. Получение прав после отзыва (должно остаться только books.view)
	perms, err = userRoleRepo.GetPermissionsForUser(user1.ID)
	assert.NoError(t, err)
	assert.Len(t, perms, 1)
	assert.Equal(t, perm1.Name, perms[0].Name)
}
