package gorm

import (
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"gorm.io/gorm"
)

type collectionRepository struct {
	db *gorm.DB
}

func NewCollectionRepository(db *gorm.DB) *collectionRepository {
	return &collectionRepository{db: db}
}

func (r *collectionRepository) Create(collection *models.Collection) error {
	return r.db.Create(collection).Error
}

func (r *collectionRepository) GetByUserID(userID uuid.UUID) ([]models.Collection, error) {
	var collections []models.Collection
	err := r.db.Where("user_id = ?", userID).Find(&collections).Error
	return collections, err
}

func (r *collectionRepository) GetByID(id uuid.UUID) (*models.Collection, error) {
	var collection models.Collection
	err := r.db.First(&collection, "id = ?", id).Error
	return &collection, err
}

func (r *collectionRepository) Update(collection *models.Collection) error {
	return r.db.Save(collection).Error
}

func (r *collectionRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Collection{}, "id = ?", id).Error
}

func (r *collectionRepository) AddBook(collectionID, bookID uuid.UUID) error {
	collection := &models.Collection{ID: collectionID}
	book := &models.Book{ID: bookID}
	return r.db.Model(collection).Association("Books").Append(book)
}

func (r *collectionRepository) RemoveBook(collectionID, bookID uuid.UUID) error {
	collection := &models.Collection{ID: collectionID}
	book := &models.Book{ID: bookID}
	return r.db.Model(collection).Association("Books").Delete(book)
}
