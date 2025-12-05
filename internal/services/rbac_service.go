package services

import (
	"errors"

	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository"
)

var ErrPermissionNotFound = errors.New("permission not found")
var ErrRoleNotFound = errors.New("role not found")

// RBACService определяет интерфейс для управления ролями и правами
type RBACService interface {
	// Permissions
	CreatePermission(name, description string) (*models.Permission, error)
	GetPermissionByName(name string) (*models.Permission, error)
	GetAllPermissions() ([]models.Permission, error)

	// Roles
	CreateRole(name, description string, isSystem bool) (*models.Role, error)
	GetRoleByName(name string) (*models.Role, error)
	GetAllRoles() ([]models.Role, error)
	AddPermissionToRole(roleName, permissionName string) error
	RemovePermissionFromRole(roleName, permissionName string) error

	// User Roles
	AssignRoleToUser(userID uuid.UUID, roleName string) error
	RevokeRoleFromUser(userID uuid.UUID, roleName string) error
	GetUserPermissions(userID uuid.UUID) ([]models.Permission, error)
	HasPermission(userID uuid.UUID, permissionName string) (bool, error)
}

type rbacService struct {
	roleRepo       repository.RoleRepository
	permissionRepo repository.PermissionRepository
	userRoleRepo   repository.UserRoleRepository
}

func NewRBACService(
	roleRepo repository.RoleRepository,
	permissionRepo repository.PermissionRepository,
	userRoleRepo repository.UserRoleRepository,
) RBACService {
	return &rbacService{
		roleRepo:       roleRepo,
		permissionRepo: permissionRepo,
		userRoleRepo:   userRoleRepo,
	}
}

// Permissions
func (s *rbacService) CreatePermission(name, description string) (*models.Permission, error) {
	perm := &models.Permission{Name: name, Description: description}
	err := s.permissionRepo.Create(perm)
	return perm, err
}

func (s *rbacService) GetPermissionByName(name string) (*models.Permission, error) {
	return s.permissionRepo.GetByName(name)
}

func (s *rbacService) GetAllPermissions() ([]models.Permission, error) {
	return s.permissionRepo.GetAll()
}

// Roles
func (s *rbacService) CreateRole(name, description string, isSystem bool) (*models.Role, error) {
	role := &models.Role{Name: name, Description: description, IsSystem: isSystem}
	err := s.roleRepo.Create(role)
	return role, err
}

func (s *rbacService) GetRoleByName(name string) (*models.Role, error) {
	return s.roleRepo.GetByName(name)
}

func (s *rbacService) GetAllRoles() ([]models.Role, error) {
	return s.roleRepo.GetAll()
}

func (s *rbacService) AddPermissionToRole(roleName, permissionName string) error {
	role, err := s.roleRepo.GetByName(roleName)
	if err != nil {
		return ErrRoleNotFound
	}
	perm, err := s.permissionRepo.GetByName(permissionName)
	if err != nil {
		return ErrPermissionNotFound
	}
	return s.roleRepo.AddPermission(role.ID, perm.ID)
}

func (s *rbacService) RemovePermissionFromRole(roleName, permissionName string) error {
	role, err := s.roleRepo.GetByName(roleName)
	if err != nil {
		return ErrRoleNotFound
	}
	perm, err := s.permissionRepo.GetByName(permissionName)
	if err != nil {
		return ErrPermissionNotFound
	}
	return s.roleRepo.RemovePermission(role.ID, perm.ID)
}

// User Roles
func (s *rbacService) AssignRoleToUser(userID uuid.UUID, roleName string) error {
	role, err := s.roleRepo.GetByName(roleName)
	if err != nil {
		return ErrRoleNotFound
	}
	return s.userRoleRepo.AssignRole(userID, role.ID)
}

func (s *rbacService) RevokeRoleFromUser(userID uuid.UUID, roleName string) error {
	role, err := s.roleRepo.GetByName(roleName)
	if err != nil {
		return ErrRoleNotFound
	}
	return s.userRoleRepo.RevokeRole(userID, role.ID)
}

func (s *rbacService) GetUserPermissions(userID uuid.UUID) ([]models.Permission, error) {
	return s.userRoleRepo.GetPermissionsForUser(userID)
}

func (s *rbacService) HasPermission(userID uuid.UUID, permissionName string) (bool, error) {
	permissions, err := s.GetUserPermissions(userID)
	if err != nil {
		return false, err
	}
	for _, p := range permissions {
		if p.Name == permissionName {
			return true, nil
		}
	}
	return false, nil
}
