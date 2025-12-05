package gorm

import (
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"gorm.io/gorm"
)

type userGroupRepository struct {
	db *gorm.DB
}

func NewUserGroupRepository(db *gorm.DB) *userGroupRepository {
	return &userGroupRepository{db: db}
}

func (r *userGroupRepository) Create(group *models.UserGroup) error {
	return r.db.Create(group).Error
}

func (r *userGroupRepository) GetByID(id uuid.UUID) (*models.UserGroup, error) {
	var group models.UserGroup
	err := r.db.Preload("AllowedCategories").First(&group, "id = ?", id).Error
	return &group, err
}

func (r *userGroupRepository) GetAll() ([]models.UserGroup, error) {
	var groups []models.UserGroup
	err := r.db.Preload("AllowedCategories").Where("is_active = ?", true).Order("name").Find(&groups).Error
	return groups, err
}

func (r *userGroupRepository) GetByType(groupType models.UserGroupType) ([]models.UserGroup, error) {
	var groups []models.UserGroup
	err := r.db.Where("type = ? AND is_active = ?", groupType, true).Find(&groups).Error
	return groups, err
}

func (r *userGroupRepository) Update(group *models.UserGroup) error {
	return r.db.Save(group).Error
}

func (r *userGroupRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.UserGroup{}, "id = ?", id).Error
}

func (r *userGroupRepository) GetUsersByGroupID(groupID uuid.UUID) ([]models.User, error) {
	var users []models.User
	err := r.db.Where("group_id = ?", groupID).Find(&users).Error
	return users, err
}

func (r *userGroupRepository) List(limit, offset int) ([]models.UserGroup, error) {
	var groups []models.UserGroup
	err := r.db.Preload("AllowedCategories").Where("is_active = ?", true).Order("name").Limit(limit).Offset(offset).Find(&groups).Error
	return groups, err
}
