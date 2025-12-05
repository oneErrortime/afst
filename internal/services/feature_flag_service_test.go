package services_test

import (
	"errors"
	"testing"

	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/services"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockFeatureFlagRepository - мок-объект для репозитория
type MockFeatureFlagRepository struct {
	mock.Mock
}

func (m *MockFeatureFlagRepository) GetByName(name string) (*models.FeatureFlag, error) {
	args := m.Called(name)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.FeatureFlag), args.Error(1)
}

func (m *MockFeatureFlagRepository) GetAll() ([]models.FeatureFlag, error) {
	args := m.Called()
	return args.Get(0).([]models.FeatureFlag), args.Error(1)
}

func (m *MockFeatureFlagRepository) Update(flag *models.FeatureFlag) error {
	args := m.Called(flag)
	return args.Error(0)
}

func (m *MockFeatureFlagRepository) Create(flag *models.FeatureFlag) error {
	args := m.Called(flag)
	return args.Error(0)
}

func TestFeatureFlagService_IsFeatureEnabled(t *testing.T) {
	mockRepo := new(MockFeatureFlagRepository)
	svc := services.NewFeatureFlagService(mockRepo)

	// 1. Флаг включен (boolean: true)
	mockRepo.On("GetByName", "analytics").Return(&models.FeatureFlag{
		Name: "analytics", Type: models.TypeBoolean, Value: "true", IsActive: true,
	}, nil).Once()
	enabled, err := svc.IsFeatureEnabled("analytics")
	assert.NoError(t, err)
	assert.True(t, enabled)

	// 2. Флаг выключен (boolean: false)
	mockRepo.On("GetByName", "analytics").Return(&models.FeatureFlag{
		Name: "analytics", Type: models.TypeBoolean, Value: "false", IsActive: true,
	}, nil).Once()
	enabled, err = svc.IsFeatureEnabled("analytics")
	assert.NoError(t, err)
	assert.False(t, enabled)

	// 3. Флаг неактивен (IsActive: false)
	mockRepo.On("GetByName", "analytics").Return(&models.FeatureFlag{
		Name: "analytics", Type: models.TypeBoolean, Value: "true", IsActive: false,
	}, nil).Once()
	enabled, err = svc.IsFeatureEnabled("analytics")
	assert.NoError(t, err)
	assert.False(t, enabled)

	// 4. Флаг не найден (ошибка репозитория)
	mockRepo.On("GetByName", "non_existent").Return(nil, errors.New("not found")).Once()
	enabled, err = svc.IsFeatureEnabled("non_existent")
	assert.NoError(t, err) // Ожидаем, что сервис не вернет ошибку, а вернет false
	assert.False(t, enabled)

	// 5. Флаг не boolean, но активен
	mockRepo.On("GetByName", "max_limit").Return(&models.FeatureFlag{
		Name: "max_limit", Type: models.TypeInteger, Value: "10", IsActive: true,
	}, nil).Once()
	enabled, err = svc.IsFeatureEnabled("max_limit")
	assert.NoError(t, err)
	assert.True(t, enabled)
	
	mockRepo.AssertExpectations(t)
}

func TestFeatureFlagService_GetFeatureInt(t *testing.T) {
	mockRepo := new(MockFeatureFlagRepository)
	svc := services.NewFeatureFlagService(mockRepo)

	// 1. Успешное получение Integer
	mockRepo.On("GetByName", "max_limit").Return(&models.FeatureFlag{
		Name: "max_limit", Type: models.TypeInteger, Value: "100", IsActive: true,
	}, nil).Once()
	val, err := svc.GetFeatureInt("max_limit")
	assert.NoError(t, err)
	assert.Equal(t, 100, val)

	// 2. Флаг неактивен
	mockRepo.On("GetByName", "max_limit").Return(&models.FeatureFlag{
		Name: "max_limit", Type: models.TypeInteger, Value: "100", IsActive: false,
	}, nil).Once()
	val, err = svc.GetFeatureInt("max_limit")
	assert.Error(t, err)
	assert.Equal(t, 0, val)
	assert.Contains(t, err.Error(), "is disabled")

	// 3. Неверный тип данных (string вместо int)
	mockRepo.On("GetByName", "max_limit").Return(&models.FeatureFlag{
		Name: "max_limit", Type: models.TypeInteger, Value: "ten", IsActive: true,
	}, nil).Once()
	val, err = svc.GetFeatureInt("max_limit")
	assert.Error(t, err)
	assert.Equal(t, 0, val)
	assert.Contains(t, err.Error(), "not a valid integer")
	
	// 4. Флаг не найден
	mockRepo.On("GetByName", "non_existent").Return(nil, errors.New("not found")).Once()
	val, err = svc.GetFeatureInt("non_existent")
	assert.Error(t, err)
	assert.Equal(t, 0, val)
	assert.Contains(t, err.Error(), "not found")

	mockRepo.AssertExpectations(t)
}
