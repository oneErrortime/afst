package services

import (
	"errors"
	"strconv"

	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository"
)

// FeatureFlagService определяет интерфейс для работы с флагами
type FeatureFlagService interface {
	GetFlag(name string) (*models.FeatureFlag, error)
	IsFeatureEnabled(name string) (bool, error)
	GetFeatureValue(name string) (string, error)
	GetFeatureInt(name string) (int, error)
	GetAllFlags() ([]models.FeatureFlag, error)
	UpdateFlag(flag *models.FeatureFlag) error
	CreateFlag(flag *models.FeatureFlag) error
}

type featureFlagService struct {
	repo repository.FeatureFlagRepository
}

func NewFeatureFlagService(repo repository.FeatureFlagRepository) FeatureFlagService {
	return &featureFlagService{repo: repo}
}

func (s *featureFlagService) GetFlag(name string) (*models.FeatureFlag, error) {
	return s.repo.GetByName(name)
}

func (s *featureFlagService) IsFeatureEnabled(name string) (bool, error) {
	flag, err := s.repo.GetByName(name)
	if err != nil {
		// Если флаг не найден, по умолчанию считаем его выключенным
		return false, nil 
	}
	if !flag.IsActive {
		return false, nil
	}
	
	if flag.Type == models.TypeBoolean {
		return flag.Value == "true", nil
	}
	
	// Для других типов, если флаг активен, считаем его включенным
	return true, nil
}

func (s *featureFlagService) GetFeatureValue(name string) (string, error) {
	flag, err := s.repo.GetByName(name)
	if err != nil {
		return "", err
	}
	if !flag.IsActive {
		return "", errors.New("feature flag is disabled")
	}
	return flag.Value, nil
}

func (s *featureFlagService) GetFeatureInt(name string) (int, error) {
	value, err := s.GetFeatureValue(name)
	if err != nil {
		return 0, err
	}
	
	if flag, _ := s.repo.GetByName(name); flag != nil && flag.Type != models.TypeInteger {
		return 0, errors.New("feature flag is not of type integer")
	}
	
	intValue, err := strconv.Atoi(value)
	if err != nil {
		return 0, errors.New("feature flag value is not a valid integer")
	}
	return intValue, nil
}

func (s *featureFlagService) GetAllFlags() ([]models.FeatureFlag, error) {
	return s.repo.GetAll()
}

func (s *featureFlagService) UpdateFlag(flag *models.FeatureFlag) error {
	return s.repo.Update(flag)
}

func (s *featureFlagService) CreateFlag(flag *models.FeatureFlag) error {
	return s.repo.Create(flag)
}
