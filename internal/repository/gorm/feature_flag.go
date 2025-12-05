package gorm

import (
	"github.com/oneErrortime/afst/internal/models"
	"gorm.io/gorm"
)

type featureFlagRepository struct {
	db *gorm.DB
}

func NewFeatureFlagRepository(db *gorm.DB) *featureFlagRepository {
	return &featureFlagRepository{db: db}
}

func (r *featureFlagRepository) GetByName(name string) (*models.FeatureFlag, error) {
	var flag models.FeatureFlag
	err := r.db.Where("name = ?", name).First(&flag).Error
	return &flag, err
}

func (r *featureFlagRepository) GetAll() ([]models.FeatureFlag, error) {
	var flags []models.FeatureFlag
	err := r.db.Find(&flags).Error
	return flags, err
}

func (r *featureFlagRepository) Update(flag *models.FeatureFlag) error {
	return r.db.Save(flag).Error
}

func (r *featureFlagRepository) Create(flag *models.FeatureFlag) error {
	return r.db.Create(flag).Error
}
