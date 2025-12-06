package services

import (
	"errors"

	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository"
)

type AnnotationService interface {
	Create(userID uuid.UUID, dto *models.CreateAnnotationDTO) (*models.Annotation, error)
	GetByID(id uuid.UUID) (*models.Annotation, error)
	GetBookAnnotations(userID, bookID uuid.UUID, includePublic bool) ([]models.Annotation, error)
	Update(id, userID uuid.UUID, dto *models.UpdateAnnotationDTO) (*models.Annotation, error)
	Delete(id, userID uuid.UUID) error
}

type annotationService struct {
	annotationRepo repository.AnnotationRepository
	bookRepo       repository.BookRepository
	accessRepo     repository.BookAccessRepository
}

func NewAnnotationService(
	annotationRepo repository.AnnotationRepository,
	bookRepo repository.BookRepository,
	accessRepo repository.BookAccessRepository,
) AnnotationService {
	return &annotationService{
		annotationRepo: annotationRepo,
		bookRepo:       bookRepo,
		accessRepo:     accessRepo,
	}
}

func (s *annotationService) Create(userID uuid.UUID, dto *models.CreateAnnotationDTO) (*models.Annotation, error) {
	_, err := s.bookRepo.GetByID(dto.BookID)
	if err != nil {
		return nil, errors.New("книга не найдена")
	}

	access, err := s.accessRepo.GetActiveByUserAndBook(userID, dto.BookID)
	if err != nil || access == nil {
		return nil, errors.New("нет доступа к этой книге")
	}

	if !access.IsValid() {
		return nil, errors.New("доступ к книге истёк")
	}

	annotation := &models.Annotation{
		UserID:       userID,
		BookID:       dto.BookID,
		FileID:       dto.FileID,
		Type:         dto.Type,
		PageNumber:   dto.PageNumber,
		Content:      dto.Content,
		SelectedText: dto.SelectedText,
		PositionData: dto.PositionData,
		Color:        dto.Color,
		IsPublic:     dto.IsPublic,
	}

	if err := s.annotationRepo.Create(annotation); err != nil {
		return nil, err
	}

	return annotation, nil
}

func (s *annotationService) GetByID(id uuid.UUID) (*models.Annotation, error) {
	return s.annotationRepo.GetByID(id)
}

func (s *annotationService) GetBookAnnotations(userID, bookID uuid.UUID, includePublic bool) ([]models.Annotation, error) {
	access, err := s.accessRepo.GetActiveByUserAndBook(userID, bookID)
	if err != nil || access == nil {
		return nil, errors.New("нет доступа к этой книге")
	}

	userAnnotations, err := s.annotationRepo.GetByUserAndBook(userID, bookID)
	if err != nil {
		return nil, err
	}

	if !includePublic {
		return userAnnotations, nil
	}

	publicAnnotations, err := s.annotationRepo.GetByBookPublic(bookID)
	if err != nil {
		return userAnnotations, nil
	}

	allAnnotations := make([]models.Annotation, 0, len(userAnnotations)+len(publicAnnotations))
	allAnnotations = append(allAnnotations, userAnnotations...)
	
	userIDSet := make(map[uuid.UUID]bool)
	for _, a := range userAnnotations {
		userIDSet[a.ID] = true
	}
	
	for _, pa := range publicAnnotations {
		if !userIDSet[pa.ID] {
			allAnnotations = append(allAnnotations, pa)
		}
	}

	return allAnnotations, nil
}

func (s *annotationService) Update(id, userID uuid.UUID, dto *models.UpdateAnnotationDTO) (*models.Annotation, error) {
	annotation, err := s.annotationRepo.GetByID(id)
	if err != nil {
		return nil, errors.New("аннотация не найдена")
	}

	if annotation.UserID != userID {
		return nil, errors.New("нет прав на редактирование этой аннотации")
	}

	if dto.Content != nil {
		annotation.Content = dto.Content
	}
	if dto.Color != nil {
		annotation.Color = dto.Color
	}
	if dto.IsPublic != nil {
		annotation.IsPublic = *dto.IsPublic
	}

	if err := s.annotationRepo.Update(annotation); err != nil {
		return nil, err
	}

	return annotation, nil
}

func (s *annotationService) Delete(id, userID uuid.UUID) error {
	annotation, err := s.annotationRepo.GetByID(id)
	if err != nil {
		return errors.New("аннотация не найдена")
	}

	if annotation.UserID != userID {
		return errors.New("нет прав на удаление этой аннотации")
	}

	return s.annotationRepo.Delete(id)
}
