package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// FeatureFlagType определяет тип значения флага (boolean, string, integer)
type FeatureFlagType string

const (
	TypeBoolean FeatureFlagType = "boolean"
	TypeString  FeatureFlagType = "string"
	TypeInteger FeatureFlagType = "integer"
)

// FeatureFlag представляет собой запись в базе данных для динамического управления функциональностью
type FeatureFlag struct {
	ID          uuid.UUID       `gorm:"type:uuid;default:uuid_generate_v4()" json:"id"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
	DeletedAt   gorm.DeletedAt  `gorm:"index" json:"-"`
	
	Name        string          `gorm:"uniqueIndex;not null" json:"name"`
	Description string          `json:"description"`
	Type        FeatureFlagType `gorm:"type:varchar(10);not null" json:"type"`
	Value       string          `gorm:"not null" json:"value"` // Значение хранится как строка для универсальности
	IsActive    bool            `gorm:"default:true" json:"is_active"`
}
