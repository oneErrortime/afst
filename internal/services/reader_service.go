package services

import (
	"errors"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// readerService реализация ReaderService
type readerService struct {
	readerRepo repository.ReaderRepository
}

// NewReaderService создает новый экземпляр readerService
func NewReaderService(readerRepo repository.ReaderRepository) ReaderService {
	return &readerService{
		readerRepo: readerRepo,
	}
}

// CreateReader создает нового читателя
func (s *readerService) CreateReader(dto *models.CreateReaderDTO) (*models.Reader, error) {
	// Проверяем уникальность email
	existingReader, err := s.readerRepo.GetByEmail(dto.Email)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	if existingReader != nil {
		return nil, errors.New("читатель с таким email уже существует")
	}

	// Создаем читателя
	reader := &models.Reader{
		Name:  dto.Name,
		Email: dto.Email,
	}

	if err := s.readerRepo.Create(reader); err != nil {
		return nil, err
	}

	return reader, nil
}

// GetReaderByID возвращает читателя по ID
func (s *readerService) GetReaderByID(id uuid.UUID) (*models.Reader, error) {
	reader, err := s.readerRepo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("читатель не найден")
		}
		return nil, err
	}
	return reader, nil
}

// GetAllReaders возвращает всех читателей с пагинацией
func (s *readerService) GetAllReaders(limit, offset int) ([]models.Reader, error) {
	// Устанавливаем максимальный лимит для безопасности
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	return s.readerRepo.GetAll(limit, offset)
}

// UpdateReader обновляет читателя
func (s *readerService) UpdateReader(id uuid.UUID, dto *models.UpdateReaderDTO) (*models.Reader, error) {
	// Проверяем, существует ли читатель
	reader, err := s.readerRepo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("читатель не найден")
		}
		return nil, err
	}

	// Проверяем уникальность email, если он изменяется
	if dto.Email != nil && *dto.Email != reader.Email {
		existingReader, err := s.readerRepo.GetByEmail(*dto.Email)
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
		if existingReader != nil && existingReader.ID != id {
			return nil, errors.New("читатель с таким email уже существует")
		}
	}

	// Обновляем поля
	if dto.Name != nil {
		reader.Name = *dto.Name
	}
	if dto.Email != nil {
		reader.Email = *dto.Email
	}

	if err := s.readerRepo.Update(reader); err != nil {
		return nil, err
	}

	return reader, nil
}

// DeleteReader удаляет читателя
func (s *readerService) DeleteReader(id uuid.UUID) error {
	// Проверяем, существует ли читатель
	_, err := s.readerRepo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("читатель не найден")
		}
		return err
	}

	return s.readerRepo.Delete(id)
}

// Count возвращает общее количество читателей
func (s *readerService) Count() (int64, error) {
	return s.readerRepo.Count()
}
