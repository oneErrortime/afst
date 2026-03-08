package gorm

import (
	"crypto/sha256"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"gorm.io/gorm"
)

type apiKeyRepository struct {
	db *gorm.DB
}

func NewAPIKeyRepository(db *gorm.DB) *apiKeyRepository {
	return &apiKeyRepository{db: db}
}

func (r *apiKeyRepository) Create(key *models.APIKey) error {
	return r.db.Create(key).Error
}

func (r *apiKeyRepository) GetByID(id uuid.UUID) (*models.APIKey, error) {
	var key models.APIKey
	err := r.db.Where("id = ? AND deleted_at IS NULL", id).First(&key).Error
	return &key, err
}

func (r *apiKeyRepository) GetByHash(keyHash string) (*models.APIKey, error) {
	var key models.APIKey
	err := r.db.Where("key_hash = ? AND deleted_at IS NULL AND is_active = true", keyHash).First(&key).Error
	if err != nil {
		return nil, err
	}
	// Проверяем срок действия
	if key.ExpiresAt != nil && time.Now().After(*key.ExpiresAt) {
		return nil, fmt.Errorf("api key expired")
	}
	return &key, nil
}

func (r *apiKeyRepository) GetByUserID(userID uuid.UUID) ([]models.APIKey, error) {
	var keys []models.APIKey
	err := r.db.Where("user_id = ? AND deleted_at IS NULL", userID).
		Order("created_at DESC").Find(&keys).Error
	return keys, err
}

func (r *apiKeyRepository) Update(key *models.APIKey) error {
	return r.db.Save(key).Error
}

func (r *apiKeyRepository) Delete(id uuid.UUID) error {
	now := time.Now()
	return r.db.Model(&models.APIKey{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"is_active":  false,
			"deleted_at": now,
		}).Error
}

func (r *apiKeyRepository) DeductTokens(id uuid.UUID, cost int64) error {
	return r.db.Model(&models.APIKey{}).
		Where("id = ? AND token_balance >= ?", id, cost).
		Updates(map[string]interface{}{
			"token_balance": gorm.Expr("token_balance - ?", cost),
			"tokens_used":   gorm.Expr("tokens_used + ?", cost),
			"last_used_at":  time.Now(),
		}).Error
}

func (r *apiKeyRepository) AddTokens(id uuid.UUID, amount int64) error {
	return r.db.Model(&models.APIKey{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"token_balance": gorm.Expr("token_balance + ?", amount),
		}).Error
}

func (r *apiKeyRepository) LogUsage(log *models.APIUsageLog) error {
	return r.db.Create(log).Error
}

func (r *apiKeyRepository) GetUsageLogs(apiKeyID uuid.UUID, limit int) ([]models.APIUsageLog, error) {
	var logs []models.APIUsageLog
	err := r.db.Where("api_key_id = ?", apiKeyID).
		Order("created_at DESC").
		Limit(limit).Find(&logs).Error
	return logs, err
}

func (r *apiKeyRepository) GetUsageStats(apiKeyID uuid.UUID) (*models.APIUsageStatsDTO, error) {
	key, err := r.GetByID(apiKeyID)
	if err != nil {
		return nil, err
	}

	var totalCalls int64
	r.db.Model(&models.APIUsageLog{}).Where("api_key_id = ?", apiKeyID).Count(&totalCalls)

	var topEndpoints []models.EndpointStat
	r.db.Model(&models.APIUsageLog{}).
		Select("endpoint, method, COUNT(*) as calls, SUM(tokens_cost) as tokens").
		Where("api_key_id = ?", apiKeyID).
		Group("endpoint, method").
		Order("calls DESC").
		Limit(10).
		Scan(&topEndpoints)

	recentLogs, _ := r.GetUsageLogs(apiKeyID, 20)

	return &models.APIUsageStatsDTO{
		APIKeyID:     apiKeyID,
		TotalCalls:   totalCalls,
		TotalTokens:  key.TokensUsed,
		Balance:      key.TokenBalance,
		TopEndpoints: topEndpoints,
		RecentLogs:   recentLogs,
	}, nil
}

// HashKey — SHA-256 хэш сырого ключа (используется для lookup).
func HashKey(rawKey string) string {
	h := sha256.Sum256([]byte(rawKey))
	return fmt.Sprintf("%x", h)
}
