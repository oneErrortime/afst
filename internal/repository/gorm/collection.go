package gorm

import (
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository"
	"gorm.io/gorm"
)

type collectionRepository struct {
	db *gorm.DB
}

func NewCollectionRepository(db *gorm.DB) repository.CollectionRepository {
	return &collectionRepository{db: db}
}

func (r *collectionRepository) Create(collection *models.Collection) error {
	return r.db.Create(collection).Error
}

func (r *collectionRepository) GetByID(id uuid.UUID) (*models.Collection, error) {
	var collection models.Collection
	err := r.db.Preload("Books").Preload("User").First(&collection, "id = ?", id).Error
	return &collection, err
}

func (r *collectionRepository) GetByUserID(userID uuid.UUID) ([]models.Collection, error) {
	var collections []models.Collection
	err := r.db.Where("user_id = ?", userID).Preload("Books").Order("sort_order ASC, created_at DESC").Find(&collections).Error
	return collections, err
}

func (r *collectionRepository) GetPublic(limit, offset int) ([]models.Collection, error) {
	var collections []models.Collection
	query := r.db.Where("is_public = ?", true).Preload("Books").Preload("User").Order("created_at DESC")
	if limit > 0 {
		query = query.Limit(limit).Offset(offset)
	}
	err := query.Find(&collections).Error
	return collections, err
}

func (r *collectionRepository) Update(collection *models.Collection) error {
	return r.db.Save(collection).Error
}

func (r *collectionRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Collection{}, "id = ?", id).Error
}

func (r *collectionRepository) AddBook(collectionID, bookID uuid.UUID, sortOrder int, notes *string) error {
	collectionBook := models.CollectionBook{
		CollectionID: collectionID,
		BookID:       bookID,
		SortOrder:    sortOrder,
		Notes:        notes,
	}
	return r.db.Create(&collectionBook).Error
}

func (r *collectionRepository) RemoveBook(collectionID, bookID uuid.UUID) error {
	return r.db.Where("collection_id = ? AND book_id = ?", collectionID, bookID).Delete(&models.CollectionBook{}).Error
}

func (r *collectionRepository) GetBooksInCollection(collectionID uuid.UUID) ([]models.Book, error) {
	var books []models.Book
	err := r.db.
		Joins("JOIN collection_books ON collection_books.book_id = books.id").
		Where("collection_books.collection_id = ? AND collection_books.deleted_at IS NULL", collectionID).
		Order("collection_books.sort_order ASC").
		Preload("Categories").
		Preload("Files").
		Find(&books).Error
	return books, err
}

func (r *collectionRepository) Count(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&models.Collection{}).Where("user_id = ?", userID).Count(&count).Error
	return count, err
}
