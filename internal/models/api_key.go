package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// APIKey — ключ внешнего API, привязанный к пользователю.
// Хранит хэш ключа (чистый ключ выдаётся единожды при создании),
// баланс токенов для биллинга и метаданные использования.
type APIKey struct {
	ID           uuid.UUID  `json:"id"            gorm:"type:text;primary_key"`
	UserID       uuid.UUID  `json:"user_id"       gorm:"type:text;not null;index"`
	Name         string     `json:"name"          gorm:"not null"`
	// KeyHash — SHA-256(rawKey), сам ключ не хранится
	KeyHash      string     `json:"-"             gorm:"uniqueIndex;not null"`
	// Prefix первых 8 символов ключа для отображения в UI
	KeyPrefix    string     `json:"key_prefix"    gorm:"not null"`
	TokenBalance int64      `json:"token_balance" gorm:"not null;default:1000"`
	TokensUsed   int64      `json:"tokens_used"   gorm:"not null;default:0"`
	IsActive     bool       `json:"is_active"     gorm:"not null;default:true"`
	ExpiresAt    *time.Time `json:"expires_at,omitempty"`
	LastUsedAt   *time.Time `json:"last_used_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	DeletedAt    *time.Time `json:"-"             gorm:"index"`

	User *User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

func (APIKey) TableName() string { return "api_keys" }

func (k *APIKey) BeforeCreate(tx *gorm.DB) error {
	if k.ID == uuid.Nil {
		k.ID = uuid.New()
	}
	return nil
}

// HasTokens проверяет, есть ли достаточно токенов для операции.
func (k *APIKey) HasTokens(cost int64) bool {
	return k.IsActive && k.TokenBalance >= cost
}

// APIUsageLog — запись каждого обращения к внешнему API.
type APIUsageLog struct {
	ID         uint      `json:"id"          gorm:"primary_key;autoIncrement"`
	APIKeyID   uuid.UUID `json:"api_key_id"  gorm:"type:text;not null;index"`
	Endpoint   string    `json:"endpoint"    gorm:"not null"`
	Method     string    `json:"method"      gorm:"not null"`
	StatusCode int       `json:"status_code" gorm:"not null"`
	TokensCost int64     `json:"tokens_cost" gorm:"not null;default:0"`
	IPAddress  string    `json:"ip_address"`
	CreatedAt  time.Time `json:"created_at"`

	APIKey *APIKey `json:"api_key,omitempty" gorm:"foreignKey:APIKeyID"`
}

func (APIUsageLog) TableName() string { return "api_usage_logs" }

// APIKeyResponseDTO — DTO для отображения ключа (без хэша).
type APIKeyResponseDTO struct {
	ID           uuid.UUID  `json:"id"`
	Name         string     `json:"name"`
	KeyPrefix    string     `json:"key_prefix"`
	TokenBalance int64      `json:"token_balance"`
	TokensUsed   int64      `json:"tokens_used"`
	IsActive     bool       `json:"is_active"`
	ExpiresAt    *time.Time `json:"expires_at,omitempty"`
	LastUsedAt   *time.Time `json:"last_used_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
}

// APIKeyCreatedDTO — DTO при создании: содержит сырой ключ (показывается один раз).
type APIKeyCreatedDTO struct {
	APIKeyResponseDTO
	RawKey string `json:"key"` // показывается только при создании
}

// CreateAPIKeyDTO — входной DTO для создания ключа.
type CreateAPIKeyDTO struct {
	Name      string     `json:"name"       validate:"required,min=1,max=100"`
	ExpiresAt *time.Time `json:"expires_at,omitempty"`
}

// APIUsageStatsDTO — агрегированная статистика использования ключа.
type APIUsageStatsDTO struct {
	APIKeyID     uuid.UUID        `json:"api_key_id"`
	TotalCalls   int64            `json:"total_calls"`
	TotalTokens  int64            `json:"total_tokens_spent"`
	Balance      int64            `json:"token_balance"`
	TopEndpoints []EndpointStat   `json:"top_endpoints"`
	RecentLogs   []APIUsageLog    `json:"recent_logs"`
}

type EndpointStat struct {
	Endpoint string `json:"endpoint"`
	Method   string `json:"method"`
	Calls    int64  `json:"calls"`
	Tokens   int64  `json:"tokens"`
}

// TopUpDTO — DTO для пополнения баланса (только admin).
type TopUpDTO struct {
	Tokens int64  `json:"tokens" validate:"required,min=1,max=1000000"`
	Reason string `json:"reason,omitempty"`
}

// TokenCost — стоимость API-операций в токенах.
var TokenCost = map[string]int64{
	"GET":    1,
	"POST":   2,
	"PUT":    2,
	"PATCH":  2,
	"DELETE": 1,
}

// SpecialTokenCost — повышенная стоимость тяжёлых операций.
var SpecialTokenCost = map[string]int64{
	"/ext/v1/files/":    10, // скачивание файлов
	"/ext/v1/books/:id/files": 5, // загрузка файлов
}
