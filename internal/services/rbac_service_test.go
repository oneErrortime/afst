package services_test

import (
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/services"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// Mock-репозитории
type MockRoleRepository struct {
	mock.Mock
}
func (m *MockRoleRepository) Create(role *models.Role) error { args := m.Called(role); return args.Error(0) }
func (m *MockRoleRepository) GetByID(id uuid.UUID) (*models.Role, error) { args := m.Called(id); return args.Get(0).(*models.Role), args.Error(1) }
func (m *MockRoleRepository) GetByName(name string) (*models.Role, error) { args := m.Called(name); return args.Get(0).(*models.Role), args.Error(1) }
func (m *MockRoleRepository) GetAll() ([]models.Role, error) { args := m.Called(); return args.Get(0).([]models.Role), args.Error(1) }
func (m *MockRoleRepository) AddPermission(roleID, permissionID uuid.UUID) error { args := m.Called(roleID, permissionID); return args.Error(0) }
func (m *MockRoleRepository) RemovePermission(roleID, permissionID uuid.UUID) error { args := m.Called(roleID, permissionID); return args.Error(0) }
func (m *MockRoleRepository) GetPermissionsForRole(roleID uuid.UUID) ([]models.Permission, error) { args := m.Called(roleID); return args.Get(0).([]models.Permission), args.Error(1) }

type MockPermissionRepository struct {
	mock.Mock
}
func (m *MockPermissionRepository) Create(permission *models.Permission) error { args := m.Called(permission); return args.Error(0) }
func (m *MockPermissionRepository) GetByID(id uuid.UUID) (*models.Permission, error) { args := m.Called(id); return args.Get(0).(*models.Permission), args.Error(1) }
func (m *MockPermissionRepository) GetByName(name string) (*models.Permission, error) { args := m.Called(name); return args.Get(0).(*models.Permission), args.Error(1) }
func (m *MockPermissionRepository) GetAll() ([]models.Permission, error) { args := m.Called(); return args.Get(0).([]models.Permission), args.Error(1) }

type MockUserRoleRepository struct {
	mock.Mock
}
func (m *MockUserRoleRepository) AssignRole(userID, roleID uuid.UUID) error { args := m.Called(userID, roleID); return args.Error(0) }
func (m *MockUserRoleRepository) RevokeRole(userID, roleID uuid.UUID) error { args := m.Called(userID, roleID); return args.Error(0) }
func (m *MockUserRoleRepository) GetRolesForUser(userID uuid.UUID) ([]models.Role, error) { args := m.Called(userID); return args.Get(0).([]models.Role), args.Error(1) }
func (m *MockUserRoleRepository) GetPermissionsForUser(userID uuid.UUID) ([]models.Permission, error) { args := m.Called(userID); return args.Get(0).([]models.Permission), args.Error(1) }

func TestRBACService_HasPermission(t *testing.T) {
	mockRoleRepo := new(MockRoleRepository)
	mockPermRepo := new(MockPermissionRepository)
	mockUserRoleRepo := new(MockUserRoleRepository)
	
	svc := services.NewRBACService(mockRoleRepo, mockPermRepo, mockUserRoleRepo)
	
	userID := uuid.New()
	permName := "books.create"
	
	// 1. Пользователь имеет право
	mockUserRoleRepo.On("GetPermissionsForUser", userID).Return([]models.Permission{
		{Name: "books.view"},
		{Name: permName},
	}, nil).Once()
	
	has, err := svc.HasPermission(userID, permName)
	assert.NoError(t, err)
	assert.True(t, has)
	
	// 2. Пользователь не имеет права
	mockUserRoleRepo.On("GetPermissionsForUser", userID).Return([]models.Permission{
		{Name: "books.view"},
	}, nil).Once()
	
	has, err = svc.HasPermission(userID, permName)
	assert.NoError(t, err)
	assert.False(t, has)
	
	// 3. Ошибка репозитория
	mockUserRoleRepo.On("GetPermissionsForUser", userID).Return([]models.Permission{}, errors.New("db error")).Once()
	
	has, err = svc.HasPermission(userID, permName)
	assert.Error(t, err)
	assert.False(t, has)
	
	mockUserRoleRepo.AssertExpectations(t)
}

func TestRBACService_AddPermissionToRole(t *testing.T) {
	mockRoleRepo := new(MockRoleRepository)
	mockPermRepo := new(MockPermissionRepository)
	mockUserRoleRepo := new(MockUserRoleRepository)
	
	svc := services.NewRBACService(mockRoleRepo, mockPermRepo, mockUserRoleRepo)
	
	roleID := uuid.New()
	permID := uuid.New()
	roleName := "admin"
	permName := "users.edit"
	
	// 1. Успешное добавление
	mockRoleRepo.On("GetByName", roleName).Return(&models.Role{ID: roleID}, nil).Once()
	mockPermRepo.On("GetByName", permName).Return(&models.Permission{ID: permID}, nil).Once()
	mockRoleRepo.On("AddPermission", roleID, permID).Return(nil).Once()
	
	err := svc.AddPermissionToRole(roleName, permName)
	assert.NoError(t, err)
	
	// 2. Роль не найдена
	mockRoleRepo.On("GetByName", roleName).Return(&models.Role{}, errors.New("not found")).Once()
	
	err = svc.AddPermissionToRole(roleName, permName)
	assert.Error(t, err)
	assert.Equal(t, services.ErrRoleNotFound, err)
	
	// 3. Право не найдено
	mockRoleRepo.On("GetByName", roleName).Return(&models.Role{ID: roleID}, nil).Once()
	mockPermRepo.On("GetByName", permName).Return(&models.Permission{}, errors.New("not found")).Once()
	
	err = svc.AddPermissionToRole(roleName, permName)
	assert.Error(t, err)
	assert.Equal(t, services.ErrPermissionNotFound, err)
	
	mockRoleRepo.AssertExpectations(t)
	mockPermRepo.AssertExpectations(t)
	mockUserRoleRepo.AssertExpectations(t)
}
