package gorm

import (
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository"
	"gorm.io/gorm"
)

type annotationRepository struct {
	db *gorm.DB
}

func NewAnnotationRepository(db *gorm.DB) repository.AnnotationRepository {
	return &annotationRepository{db: db}
}

func (r *annotationRepository) Create(annotation *models.Annotation) error {
	return r.db.Create(annotation).Error
}

func (r *annotationRepository) GetByID(id uuid.UUID) (*models.Annotation, error) {
	var annotation models.Annotation
	err := r.db.Preload("Book").Preload("File").First(&annotation, "id = ?", id).Error
	return &annotation, err
}

func (r *annotationRepository) GetByUserAndBook(userID, bookID uuid.UUID) ([]models.Annotation, error) {
	var annotations []models.Annotation
	err := r.db.
		Where("user_id = ? AND book_id = ?", userID, bookID).
		Preload("File").
		Order("page_number ASC, created_at DESC").
		Find(&annotations).Error
	return annotations, err
}

func (r *annotationRepository) GetByBookPublic(bookID uuid.UUID) ([]models.Annotation, error) {
	var annotations []models.Annotation
	err := r.db.
		Where("book_id = ? AND is_public = ?", bookID, true).
		Preload("User").
		Preload("File").
		Order("page_number ASC, created_at DESC").
		Find(&annotations).Error
	return annotations, err
}

func (r *annotationRepository) Update(annotation *models.Annotation) error {
	return r.db.Save(annotation).Error
}

func (r *annotationRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Annotation{}, "id = ?", id).Error
}

func (r *annotationRepository) Count(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&models.Annotation{}).Where("user_id = ?", userID).Count(&count).Error
	return count, err
}
