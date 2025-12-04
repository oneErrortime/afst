package gorm

import (
	"time"

	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"gorm.io/gorm"
)

type subscriptionRepository struct {
	db *gorm.DB
}

func NewSubscriptionRepository(db *gorm.DB) *subscriptionRepository {
	return &subscriptionRepository{db: db}
}

func (r *subscriptionRepository) Create(subscription *models.Subscription) error {
	return r.db.Create(subscription).Error
}

func (r *subscriptionRepository) GetByID(id uuid.UUID) (*models.Subscription, error) {
	var subscription models.Subscription
	err := r.db.Preload("User").First(&subscription, "id = ?", id).Error
	return &subscription, err
}

func (r *subscriptionRepository) GetByUserID(userID uuid.UUID) (*models.Subscription, error) {
	var subscription models.Subscription
	err := r.db.Where("user_id = ?", userID).Order("created_at DESC").First(&subscription).Error
	return &subscription, err
}

func (r *subscriptionRepository) GetActiveByUserID(userID uuid.UUID) (*models.Subscription, error) {
	var subscription models.Subscription
	err := r.db.Where("user_id = ? AND status = ? AND end_date > ?", userID, models.SubStatusActive, time.Now()).First(&subscription).Error
	return &subscription, err
}

func (r *subscriptionRepository) GetAll(limit, offset int) ([]models.Subscription, error) {
	var subscriptions []models.Subscription
	err := r.db.Preload("User").Limit(limit).Offset(offset).Order("created_at DESC").Find(&subscriptions).Error
	return subscriptions, err
}

func (r *subscriptionRepository) Update(subscription *models.Subscription) error {
	return r.db.Save(subscription).Error
}

func (r *subscriptionRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Subscription{}, "id = ?", id).Error
}
