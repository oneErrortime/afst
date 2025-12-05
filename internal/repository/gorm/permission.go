package gorm

import (
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"gorm.io/gorm"
)

type permissionRepository struct {
	db *gorm.DB
}

func NewPermissionRepository(db *gorm.DB) *permissionRepository {
	return &permissionRepository{db: db}
}

func (r *permissionRepository) Create(permission *models.Permission) error {
	return r.db.Create(permission).Error
}

func (r *permissionRepository) GetByID(id uuid.UUID) (*models.Permission, error) {
	var permission models.Permission
	err := r.db.First(&permission, "id = ?", id).Error
	return &permission, err
}

func (r *permissionRepository) GetByName(name string) (*models.Permission, error) {
	var permission models.Permission
	err := r.db.First(&permission, "name = ?", name).Error
	return &permission, err
}

func (r *permissionRepository) GetAll() ([]models.Permission, error) {
	var permissions []models.Permission
	err := r.db.Find(&permissions).Error
	return permissions, err
}
