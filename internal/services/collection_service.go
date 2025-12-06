package services

import (
	"errors"

	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository"
)

type CollectionService interface {
	Create(userID uuid.UUID, dto *models.CreateCollectionDTO) (*models.Collection, error)
	GetByID(id uuid.UUID) (*models.Collection, error)
	GetMyCollections(userID uuid.UUID) ([]models.Collection, error)
	GetPublicCollections(limit, offset int) ([]models.Collection, error)
	Update(id, userID uuid.UUID, dto *models.UpdateCollectionDTO) (*models.Collection, error)
	Delete(id, userID uuid.UUID) error
	AddBooks(collectionID, userID uuid.UUID, dto *models.AddBooksToCollectionDTO) error
	RemoveBook(collectionID, userID, bookID uuid.UUID) error
	GetBooks(collectionID uuid.UUID) ([]models.Book, error)
}

type collectionService struct {
	collectionRepo repository.CollectionRepository
	bookRepo       repository.BookRepository
}

func NewCollectionService(
	collectionRepo repository.CollectionRepository,
	bookRepo repository.BookRepository,
) CollectionService {
	return &collectionService{
		collectionRepo: collectionRepo,
		bookRepo:       bookRepo,
	}
}

func (s *collectionService) Create(userID uuid.UUID, dto *models.CreateCollectionDTO) (*models.Collection, error) {
	collection := &models.Collection{
		UserID:      userID,
		Name:        dto.Name,
		Description: dto.Description,
		IsPublic:    dto.IsPublic,
		CoverURL:    dto.CoverURL,
		BooksCount:  0,
	}

	if err := s.collectionRepo.Create(collection); err != nil {
		return nil, err
	}

	if dto.BookIDs != nil && len(dto.BookIDs) > 0 {
		for i, bookIDStr := range dto.BookIDs {
			bookID, err := uuid.Parse(bookIDStr)
			if err != nil {
				continue
			}
			
			_, err = s.bookRepo.GetByID(bookID)
			if err != nil {
				continue
			}
			
			_ = s.collectionRepo.AddBook(collection.ID, bookID, i, nil)
		}
		
		collection.BooksCount = len(dto.BookIDs)
		_ = s.collectionRepo.Update(collection)
	}

	return collection, nil
}

func (s *collectionService) GetByID(id uuid.UUID) (*models.Collection, error) {
	return s.collectionRepo.GetByID(id)
}

func (s *collectionService) GetMyCollections(userID uuid.UUID) ([]models.Collection, error) {
	return s.collectionRepo.GetByUserID(userID)
}

func (s *collectionService) GetPublicCollections(limit, offset int) ([]models.Collection, error) {
	return s.collectionRepo.GetPublic(limit, offset)
}

func (s *collectionService) Update(id, userID uuid.UUID, dto *models.UpdateCollectionDTO) (*models.Collection, error) {
	collection, err := s.collectionRepo.GetByID(id)
	if err != nil {
		return nil, errors.New("коллекция не найдена")
	}

	if collection.UserID != userID {
		return nil, errors.New("нет прав на редактирование этой коллекции")
	}

	if dto.Name != nil {
		collection.Name = *dto.Name
	}
	if dto.Description != nil {
		collection.Description = dto.Description
	}
	if dto.IsPublic != nil {
		collection.IsPublic = *dto.IsPublic
	}
	if dto.CoverURL != nil {
		collection.CoverURL = dto.CoverURL
	}
	if dto.SortOrder != nil {
		collection.SortOrder = *dto.SortOrder
	}

	if err := s.collectionRepo.Update(collection); err != nil {
		return nil, err
	}

	return collection, nil
}

func (s *collectionService) Delete(id, userID uuid.UUID) error {
	collection, err := s.collectionRepo.GetByID(id)
	if err != nil {
		return errors.New("коллекция не найдена")
	}

	if collection.UserID != userID {
		return errors.New("нет прав на удаление этой коллекции")
	}

	if collection.IsSystem {
		return errors.New("системные коллекции нельзя удалять")
	}

	return s.collectionRepo.Delete(id)
}

func (s *collectionService) AddBooks(collectionID, userID uuid.UUID, dto *models.AddBooksToCollectionDTO) error {
	collection, err := s.collectionRepo.GetByID(collectionID)
	if err != nil {
		return errors.New("коллекция не найдена")
	}

	if collection.UserID != userID {
		return errors.New("нет прав на редактирование этой коллекции")
	}

	currentCount := collection.BooksCount
	
	for i, bookIDStr := range dto.BookIDs {
		bookID, err := uuid.Parse(bookIDStr)
		if err != nil {
			continue
		}
		
		_, err = s.bookRepo.GetByID(bookID)
		if err != nil {
			continue
		}
		
		if err := s.collectionRepo.AddBook(collectionID, bookID, currentCount+i, nil); err != nil {
			continue
		}
		
		collection.BooksCount++
	}

	return s.collectionRepo.Update(collection)
}

func (s *collectionService) RemoveBook(collectionID, userID, bookID uuid.UUID) error {
	collection, err := s.collectionRepo.GetByID(collectionID)
	if err != nil {
		return errors.New("коллекция не найдена")
	}

	if collection.UserID != userID {
		return errors.New("нет прав на редактирование этой коллекции")
	}

	if err := s.collectionRepo.RemoveBook(collectionID, bookID); err != nil {
		return err
	}

	if collection.BooksCount > 0 {
		collection.BooksCount--
		return s.collectionRepo.Update(collection)
	}

	return nil
}

func (s *collectionService) GetBooks(collectionID uuid.UUID) ([]models.Book, error) {
	_, err := s.collectionRepo.GetByID(collectionID)
	if err != nil {
		return nil, errors.New("коллекция не найдена")
	}

	return s.collectionRepo.GetBooksInCollection(collectionID)
}
