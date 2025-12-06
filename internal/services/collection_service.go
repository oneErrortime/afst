package services

import (
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository"
)

type collectionService struct {
	repo repository.CollectionRepository
}

func NewCollectionService(repo repository.CollectionRepository) CollectionService {
	return &collectionService{repo: repo}
}

func (s *collectionService) CreateCollection(collection *models.Collection) error {
	return s.repo.Create(collection)
}

func (s *collectionService) GetCollectionsByUserID(userID uuid.UUID) ([]models.Collection, error) {
	return s.repo.GetByUserID(userID)
}

func (s *collectionService) GetCollectionByID(id uuid.UUID) (*models.Collection, error) {
	return s.repo.GetByID(id)
}

func (s *collectionService) UpdateCollection(collection *models.Collection) error {
	return s.repo.Update(collection)
}

func (s *collectionService) DeleteCollection(id uuid.UUID) error {
	return s.repo.Delete(id)
}

func (s *collectionService) AddBookToCollection(collectionID, bookID uuid.UUID) error {
	return s.repo.AddBook(collectionID, bookID)
}

func (s *collectionService) RemoveBookFromCollection(collectionID, bookID uuid.UUID) error {
	return s.repo.RemoveBook(collectionID, bookID)
}
