package services

import (
	"errors"

	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository"
)

type userGroupService struct {
	groupRepo repository.UserGroupRepository
	userRepo  repository.UserRepository
}

func NewUserGroupService(groupRepo repository.UserGroupRepository, userRepo repository.UserRepository) UserGroupService {
	return &userGroupService{
		groupRepo: groupRepo,
		userRepo:  userRepo,
	}
}

func (s *userGroupService) Create(dto *models.CreateUserGroupDTO) (*models.UserGroup, error) {
	group := &models.UserGroup{
		Name:        dto.Name,
		Type:        dto.Type,
		MaxBooks:    dto.MaxBooks,
		LoanDays:    dto.LoanDays,
		CanDownload: dto.CanDownload,
		IsActive:    true,
	}

	if dto.Description != nil {
		group.Description = *dto.Description
	}
	if dto.Color != nil {
		group.Color = *dto.Color
	}

	if err := s.groupRepo.Create(group); err != nil {
		return nil, err
	}

	return group, nil
}

func (s *userGroupService) GetByID(id uuid.UUID) (*models.UserGroup, error) {
	return s.groupRepo.GetByID(id)
}

func (s *userGroupService) GetAll() ([]models.UserGroup, error) {
	return s.groupRepo.GetAll()
}

func (s *userGroupService) Update(id uuid.UUID, dto *models.UpdateUserGroupDTO) (*models.UserGroup, error) {
	group, err := s.groupRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if dto.Name != nil {
		group.Name = *dto.Name
	}
	if dto.Type != nil {
		group.Type = *dto.Type
	}
	if dto.Description != nil {
		group.Description = *dto.Description
	}
	if dto.Color != nil {
		group.Color = *dto.Color
	}
	if dto.MaxBooks != nil {
		group.MaxBooks = *dto.MaxBooks
	}
	if dto.LoanDays != nil {
		group.LoanDays = *dto.LoanDays
	}
	if dto.CanDownload != nil {
		group.CanDownload = *dto.CanDownload
	}
	if dto.IsActive != nil {
		group.IsActive = *dto.IsActive
	}

	if err := s.groupRepo.Update(group); err != nil {
		return nil, err
	}

	return group, nil
}

func (s *userGroupService) Delete(id uuid.UUID) error {
	users, err := s.groupRepo.GetUsersByGroupID(id)
	if err != nil {
		return err
	}
	if len(users) > 0 {
		return errors.New("невозможно удалить группу с пользователями")
	}
	return s.groupRepo.Delete(id)
}

func (s *userGroupService) GetUsersByGroup(groupID uuid.UUID) ([]models.User, error) {
	return s.groupRepo.GetUsersByGroupID(groupID)
}

func (s *userGroupService) AssignUserToGroup(userID, groupID uuid.UUID) error {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return err
	}

	_, err = s.groupRepo.GetByID(groupID)
	if err != nil {
		return errors.New("группа не найдена")
	}

	user.GroupID = &groupID
	return s.userRepo.Update(user)
}
