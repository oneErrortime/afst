package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SubscriptionPlan string

const (
	PlanFree    SubscriptionPlan = "free"
	PlanBasic   SubscriptionPlan = "basic"
	PlanPremium SubscriptionPlan = "premium"
	PlanStudent SubscriptionPlan = "student"
)

type SubscriptionStatus string

const (
	SubStatusActive    SubscriptionStatus = "active"
	SubStatusExpired   SubscriptionStatus = "expired"
	SubStatusCancelled SubscriptionStatus = "cancelled"
	SubStatusPending   SubscriptionStatus = "pending"
)

type Subscription struct {
	ID            uuid.UUID          `json:"id" gorm:"type:text;primary_key"`
	UserID        uuid.UUID          `json:"user_id" gorm:"type:text;not null;index"`
	Plan          SubscriptionPlan   `json:"plan" gorm:"type:text;not null"`
	Status        SubscriptionStatus `json:"status" gorm:"type:text;not null;default:'pending'"`
	StartDate     time.Time          `json:"start_date" gorm:"not null"`
	EndDate       time.Time          `json:"end_date" gorm:"not null"`
	MaxBooks      int                `json:"max_books" gorm:"not null;default:5"`
	MaxDownloads  int                `json:"max_downloads" gorm:"not null;default:0"`
	CanAccessPremium bool            `json:"can_access_premium" gorm:"default:false"`
	AutoRenew     bool               `json:"auto_renew" gorm:"default:false"`
	Price         float64            `json:"price" gorm:"default:0"`
	Currency      string             `json:"currency" gorm:"default:'RUB'"`
	PaymentID     *string            `json:"payment_id,omitempty"`
	Notes         *string            `json:"notes,omitempty"`
	CreatedAt     time.Time          `json:"created_at"`
	UpdatedAt     time.Time          `json:"updated_at"`
	DeletedAt     *time.Time         `json:"-" gorm:"index"`

	User *User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

func (Subscription) TableName() string {
	return "subscriptions"
}

func (s *Subscription) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

func (s *Subscription) IsValid() bool {
	return s.Status == SubStatusActive && time.Now().Before(s.EndDate)
}

func (s *Subscription) DaysRemaining() int {
	if !s.IsValid() {
		return 0
	}
	return int(time.Until(s.EndDate).Hours() / 24)
}

type SubscriptionPlanConfig struct {
	Plan             SubscriptionPlan `json:"plan"`
	Name             string           `json:"name"`
	Description      string           `json:"description"`
	MaxBooks         int              `json:"max_books"`
	MaxDownloads     int              `json:"max_downloads"`
	CanAccessPremium bool             `json:"can_access_premium"`
	PriceMonthly     float64          `json:"price_monthly"`
	PriceYearly      float64          `json:"price_yearly"`
}

var SubscriptionPlans = []SubscriptionPlanConfig{
	{
		Plan:             PlanFree,
		Name:             "Бесплатный",
		Description:      "Базовый доступ к библиотеке",
		MaxBooks:         2,
		MaxDownloads:     0,
		CanAccessPremium: false,
		PriceMonthly:     0,
		PriceYearly:      0,
	},
	{
		Plan:             PlanBasic,
		Name:             "Базовый",
		Description:      "Расширенный доступ к библиотеке",
		MaxBooks:         5,
		MaxDownloads:     3,
		CanAccessPremium: false,
		PriceMonthly:     299,
		PriceYearly:      2990,
	},
	{
		Plan:             PlanPremium,
		Name:             "Премиум",
		Description:      "Полный доступ ко всем книгам",
		MaxBooks:         10,
		MaxDownloads:     10,
		CanAccessPremium: true,
		PriceMonthly:     599,
		PriceYearly:      5990,
	},
	{
		Plan:             PlanStudent,
		Name:             "Студенческий",
		Description:      "Специальный тариф для студентов",
		MaxBooks:         7,
		MaxDownloads:     5,
		CanAccessPremium: true,
		PriceMonthly:     199,
		PriceYearly:      1990,
	},
}
