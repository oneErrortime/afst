package services

import (
	"errors"

	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository"
)

type categoryService struct {
	categoryRepo repository.CategoryRepository
}

func NewCategoryService(categoryRepo repository.CategoryRepository) CategoryService {
	return &categoryService{
		categoryRepo: categoryRepo,
	}
}

func (s *categoryService) Create(dto *models.CreateCategoryDTO) (*models.Category, error) {
	existing, _ := s.categoryRepo.GetBySlug(dto.Slug)
	if existing != nil {
		return nil, errors.New("категория с таким slug уже существует")
	}

	category := &models.Category{
		Name:      dto.Name,
		Slug:      dto.Slug,
		ParentID:  dto.ParentID,
		SortOrder: dto.SortOrder,
		IsActive:  true,
	}

	if dto.Description != nil {
		category.Description = *dto.Description
	}
	if dto.Color != nil {
		category.Color = *dto.Color
	}
	if dto.Icon != nil {
		category.Icon = *dto.Icon
	}

	if err := s.categoryRepo.Create(category); err != nil {
		return nil, err
	}

	return category, nil
}

func (s *categoryService) GetByID(id uuid.UUID) (*models.Category, error) {
	return s.categoryRepo.GetByID(id)
}

func (s *categoryService) GetAll() ([]models.Category, error) {
	return s.categoryRepo.GetAll()
}

func (s *categoryService) GetBySlug(slug string) (*models.Category, error) {
	return s.categoryRepo.GetBySlug(slug)
}

func (s *categoryService) Update(id uuid.UUID, dto *models.UpdateCategoryDTO) (*models.Category, error) {
	category, err := s.categoryRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if dto.Name != nil {
		category.Name = *dto.Name
	}
	if dto.Slug != nil {
		existing, _ := s.categoryRepo.GetBySlug(*dto.Slug)
		if existing != nil && existing.ID != id {
			return nil, errors.New("категория с таким slug уже существует")
		}
		category.Slug = *dto.Slug
	}
	if dto.Description != nil {
		category.Description = *dto.Description
	}
	if dto.Color != nil {
		category.Color = *dto.Color
	}
	if dto.Icon != nil {
		category.Icon = *dto.Icon
	}
	if dto.ParentID != nil {
		category.ParentID = dto.ParentID
	}
	if dto.SortOrder != nil {
		category.SortOrder = *dto.SortOrder
	}
	if dto.IsActive != nil {
		category.IsActive = *dto.IsActive
	}

	if err := s.categoryRepo.Update(category); err != nil {
		return nil, err
	}

	return category, nil
}

func (s *categoryService) Delete(id uuid.UUID) error {
	children, err := s.categoryRepo.GetByParentID(&id)
	if err != nil {
		return err
	}
	if len(children) > 0 {
		return errors.New("невозможно удалить категорию с подкатегориями")
	}
	return s.categoryRepo.Delete(id)
}

func (s *categoryService) GetChildren(parentID uuid.UUID) ([]models.Category, error) {
	return s.categoryRepo.GetByParentID(&parentID)
}
