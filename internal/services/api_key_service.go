package services

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository"
	gormrepo "github.com/oneErrortime/afst/internal/repository/gorm"
)

// APIKeyService — управление ключами внешнего API и биллингом.
type APIKeyService interface {
	// Управление ключами
	CreateKey(userID uuid.UUID, dto *models.CreateAPIKeyDTO) (*models.APIKeyCreatedDTO, error)
	GetByID(id uuid.UUID) (*models.APIKey, error)
	GetByRawKey(rawKey string) (*models.APIKey, error)
	ListByUser(userID uuid.UUID) ([]models.APIKeyResponseDTO, error)
	RevokeKey(id uuid.UUID, userID uuid.UUID) error

	// Биллинг
	ChargeTokens(keyID uuid.UUID, cost int64, endpoint, method, ip string, statusCode int) error
	TopUpTokens(keyID uuid.UUID, amount int64) error
	GetStats(keyID uuid.UUID, userID uuid.UUID) (*models.APIUsageStatsDTO, error)

	// Хелпер: рассчитать стоимость запроса
	CalcCost(method, path string) int64
}

type apiKeyService struct {
	repo repository.APIKeyRepository
}

func NewAPIKeyService(repo repository.APIKeyRepository) APIKeyService {
	return &apiKeyService{repo: repo}
}

// generateRawKey создаёт 32-байтный случайный hex-ключ с префиксом "lk_".
func generateRawKey() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("failed to generate key: %w", err)
	}
	return "lk_" + hex.EncodeToString(b), nil
}

func (s *apiKeyService) CreateKey(userID uuid.UUID, dto *models.CreateAPIKeyDTO) (*models.APIKeyCreatedDTO, error) {
	rawKey, err := generateRawKey()
	if err != nil {
		return nil, err
	}

	key := &models.APIKey{
		UserID:       userID,
		Name:         dto.Name,
		KeyHash:      gormrepo.HashKey(rawKey),
		KeyPrefix:    rawKey[:11], // "lk_" + 8 символов
		TokenBalance: 1000,        // стартовый баланс
		IsActive:     true,
		ExpiresAt:    dto.ExpiresAt,
	}

	if err := s.repo.Create(key); err != nil {
		return nil, fmt.Errorf("failed to create api key: %w", err)
	}

	return &models.APIKeyCreatedDTO{
		APIKeyResponseDTO: models.APIKeyResponseDTO{
			ID:           key.ID,
			Name:         key.Name,
			KeyPrefix:    key.KeyPrefix,
			TokenBalance: key.TokenBalance,
			TokensUsed:   key.TokensUsed,
			IsActive:     key.IsActive,
			ExpiresAt:    key.ExpiresAt,
			CreatedAt:    key.CreatedAt,
		},
		RawKey: rawKey,
	}, nil
}

func (s *apiKeyService) GetByID(id uuid.UUID) (*models.APIKey, error) {
	return s.repo.GetByID(id)
}

func (s *apiKeyService) GetByRawKey(rawKey string) (*models.APIKey, error) {
	hash := gormrepo.HashKey(rawKey)
	return s.repo.GetByHash(hash)
}

func (s *apiKeyService) ListByUser(userID uuid.UUID) ([]models.APIKeyResponseDTO, error) {
	keys, err := s.repo.GetByUserID(userID)
	if err != nil {
		return nil, err
	}
	dtos := make([]models.APIKeyResponseDTO, len(keys))
	for i, k := range keys {
		dtos[i] = models.APIKeyResponseDTO{
			ID:           k.ID,
			Name:         k.Name,
			KeyPrefix:    k.KeyPrefix,
			TokenBalance: k.TokenBalance,
			TokensUsed:   k.TokensUsed,
			IsActive:     k.IsActive,
			ExpiresAt:    k.ExpiresAt,
			LastUsedAt:   k.LastUsedAt,
			CreatedAt:    k.CreatedAt,
		}
	}
	return dtos, nil
}

func (s *apiKeyService) RevokeKey(id uuid.UUID, userID uuid.UUID) error {
	key, err := s.repo.GetByID(id)
	if err != nil {
		return fmt.Errorf("key not found")
	}
	if key.UserID != userID {
		return fmt.Errorf("access denied")
	}
	return s.repo.Delete(id)
}

func (s *apiKeyService) ChargeTokens(keyID uuid.UUID, cost int64, endpoint, method, ip string, statusCode int) error {
	// Логируем независимо от успеха списания
	_ = s.repo.LogUsage(&models.APIUsageLog{
		APIKeyID:   keyID,
		Endpoint:   endpoint,
		Method:     method,
		StatusCode: statusCode,
		TokensCost: cost,
		IPAddress:  ip,
		CreatedAt:  time.Now(),
	})

	if cost == 0 {
		return nil
	}

	if err := s.repo.DeductTokens(keyID, cost); err != nil {
		return fmt.Errorf("failed to deduct tokens: %w", err)
	}
	return nil
}

func (s *apiKeyService) TopUpTokens(keyID uuid.UUID, amount int64) error {
	return s.repo.AddTokens(keyID, amount)
}

func (s *apiKeyService) GetStats(keyID uuid.UUID, userID uuid.UUID) (*models.APIUsageStatsDTO, error) {
	key, err := s.repo.GetByID(keyID)
	if err != nil {
		return nil, fmt.Errorf("key not found")
	}
	if key.UserID != userID {
		return nil, fmt.Errorf("access denied")
	}
	return s.repo.GetUsageStats(keyID)
}

func (s *apiKeyService) CalcCost(method, path string) int64 {
	// Тяжёлые операции
	for prefix, cost := range models.SpecialTokenCost {
		if len(path) >= len(prefix) && path[:len(prefix)] == prefix {
			return cost
		}
	}
	// Стандартная стоимость по методу
	if cost, ok := models.TokenCost[method]; ok {
		return cost
	}
	return 1
}
