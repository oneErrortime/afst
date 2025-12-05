package gorm

import (
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"gorm.io/gorm"
)

type roleRepository struct {
	db *gorm.DB
}

func NewRoleRepository(db *gorm.DB) *roleRepository {
	return &roleRepository{db: db}
}

func (r *roleRepository) Create(role *models.Role) error {
	return r.db.Create(role).Error
}

func (r *roleRepository) GetByID(id uuid.UUID) (*models.Role, error) {
	var role models.Role
	err := r.db.Preload("Permissions").First(&role, "id = ?", id).Error
	return &role, err
}

func (r *roleRepository) GetByName(name string) (*models.Role, error) {
	var role models.Role
	err := r.db.Preload("Permissions").First(&role, "name = ?", name).Error
	return &role, err
}

func (r *roleRepository) GetAll() ([]models.Role, error) {
	var roles []models.Role
	err := r.db.Preload("Permissions").Find(&roles).Error
	return roles, err
}

func (r *roleRepository) AddPermission(roleID, permissionID uuid.UUID) error {
	return r.db.Model(&models.Role{ID: roleID}).Association("Permissions").Append(&models.Permission{ID: permissionID})
}

func (r *roleRepository) RemovePermission(roleID, permissionID uuid.UUID) error {
	return r.db.Model(&models.Role{ID: roleID}).Association("Permissions").Delete(&models.Permission{ID: permissionID})
}

func (r *roleRepository) GetPermissionsForRole(roleID uuid.UUID) ([]models.Permission, error) {
	var role models.Role
	err := r.db.Preload("Permissions").First(&role, "id = ?", roleID).Error
	if err != nil {
		return nil, err
	}
	return role.Permissions, nil
}
