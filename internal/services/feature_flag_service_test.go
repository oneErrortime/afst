package services

import (
	"errors"
	"testing"

	"github.com/oneErrortime/afst/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

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
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.FeatureFlag), args.Error(1)
}

func TestFeatureFlagService_IsActive(t *testing.T) {
	mockRepo := new(MockFeatureFlagRepository)
	flags := []models.FeatureFlag{
		{Name: "flag1", IsActive: true},
		{Name: "flag2", IsActive: false},
	}
	mockRepo.On("GetAll").Return(flags, nil)

	service := NewFeatureFlagService(mockRepo)

	assert.True(t, service.IsActive("flag1"))
	assert.False(t, service.IsActive("flag2"))
	assert.False(t, service.IsActive("non_existent_flag"))

	mockRepo.AssertExpectations(t)
}

func TestFeatureFlagService_CacheUpdate(t *testing.T) {
	mockRepo := new(MockFeatureFlagRepository)
	initialFlags := []models.FeatureFlag{
		{Name: "flag1", IsActive: true},
	}
	updatedFlags := []models.FeatureFlag{
		{Name: "flag1", IsActive: false},
		{Name: "flag2", IsActive: true},
	}

	// Initial call
	mockRepo.On("GetAll").Return(initialFlags, nil).Once()

	service := NewFeatureFlagService(mockRepo)
	assert.True(t, service.IsActive("flag1"))
	assert.False(t, service.IsActive("flag2"))

	// Update call
	mockRepo.On("GetAll").Return(updatedFlags, nil).Once()
	service.(*featureFlagService).updateCache()

	assert.False(t, service.IsActive("flag1"))
	assert.True(t, service.IsActive("flag2"))

	mockRepo.AssertExpectations(t)
}

func TestFeatureFlagService_CacheUpdateError(t *testing.T) {
	mockRepo := new(MockFeatureFlagRepository)
	initialFlags := []models.FeatureFlag{
		{Name: "flag1", IsActive: true},
	}

	mockRepo.On("GetAll").Return(initialFlags, nil).Once()
	service := NewFeatureFlagService(mockRepo)
	assert.True(t, service.IsActive("flag1"))

	mockRepo.On("GetAll").Return(nil, errors.New("db error")).Once()
	service.(*featureFlagService).updateCache()

	// Cache should not have changed
	assert.True(t, service.IsActive("flag1"))

	mockRepo.AssertExpectations(t)
}
