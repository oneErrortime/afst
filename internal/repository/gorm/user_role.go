package gorm

import (
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"gorm.io/gorm"
)

type userRoleRepository struct {
	db *gorm.DB
}

func NewUserRoleRepository(db *gorm.DB) *userRoleRepository {
	return &userRoleRepository{db: db}
}

func (r *userRoleRepository) AssignRole(userID, roleID uuid.UUID) error {
	user := models.User{ID: userID}
	role := models.Role{ID: roleID}
	
	// GORM автоматически создаст запись в user_roles
	return r.db.Model(&user).Association("Roles").Append(&role)
}

func (r *userRoleRepository) RevokeRole(userID, roleID uuid.UUID) error {
	user := models.User{ID: userID}
	role := models.Role{ID: roleID}
	
	// GORM автоматически удалит запись из user_roles
	return r.db.Model(&user).Association("Roles").Delete(&role)
}

func (r *userRoleRepository) GetRolesForUser(userID uuid.UUID) ([]models.Role, error) {
	var user models.User
	err := r.db.Preload("Roles").First(&user, "id = ?", userID).Error
	if err != nil {
		return nil, err
	}
	return user.Roles, nil
}

func (r *userRoleRepository) GetPermissionsForUser(userID uuid.UUID) ([]models.Permission, error) {
	var permissions []models.Permission
	
	// 1. Получаем все роли пользователя
	roles, err := r.GetRolesForUser(userID)
	if err != nil {
		return nil, err
	}
	
	if len(roles) == 0 {
		return permissions, nil
	}
	
	// 2. Получаем ID всех ролей
	roleIDs := make([]uuid.UUID, len(roles))
	for i, role := range roles {
		roleIDs[i] = role.ID
	}
	
	// 3. Получаем все уникальные права, связанные с этими ролями
	err = r.db.
		Table("permissions").
		Joins("JOIN role_permissions ON role_permissions.permission_id = permissions.id").
		Where("role_permissions.role_id IN (?)", roleIDs).
		Group("permissions.id"). // Уникальные права
		Find(&permissions).Error
		
	return permissions, err
}
