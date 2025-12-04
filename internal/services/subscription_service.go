package services

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository"
)

type subscriptionService struct {
	subscriptionRepo repository.SubscriptionRepository
	userRepo         repository.UserRepository
}

func NewSubscriptionService(subscriptionRepo repository.SubscriptionRepository, userRepo repository.UserRepository) SubscriptionService {
	return &subscriptionService{
		subscriptionRepo: subscriptionRepo,
		userRepo:         userRepo,
	}
}

func (s *subscriptionService) Create(userID uuid.UUID, plan models.SubscriptionPlan) (*models.Subscription, error) {
	_, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, errors.New("пользователь не найден")
	}

	existing, _ := s.subscriptionRepo.GetActiveByUserID(userID)
	if existing != nil {
		return nil, errors.New("у пользователя уже есть активная подписка")
	}

	planConfig := s.getPlanConfig(plan)
	if planConfig == nil {
		return nil, errors.New("неверный план подписки")
	}

	now := time.Now()
	subscription := &models.Subscription{
		UserID:          userID,
		Plan:            plan,
		Status:          models.SubStatusActive,
		StartDate:       now,
		EndDate:         now.AddDate(0, 1, 0),
		MaxBooks:        planConfig.MaxBooks,
		MaxDownloads:    planConfig.MaxDownloads,
		CanAccessPremium: planConfig.CanAccessPremium,
		Price:           planConfig.PriceMonthly,
		Currency:        "RUB",
	}

	if err := s.subscriptionRepo.Create(subscription); err != nil {
		return nil, err
	}

	return subscription, nil
}

func (s *subscriptionService) GetByID(id uuid.UUID) (*models.Subscription, error) {
	return s.subscriptionRepo.GetByID(id)
}

func (s *subscriptionService) GetByUserID(userID uuid.UUID) (*models.Subscription, error) {
	return s.subscriptionRepo.GetByUserID(userID)
}

func (s *subscriptionService) GetActiveByUserID(userID uuid.UUID) (*models.Subscription, error) {
	return s.subscriptionRepo.GetActiveByUserID(userID)
}

func (s *subscriptionService) Cancel(id uuid.UUID) error {
	subscription, err := s.subscriptionRepo.GetByID(id)
	if err != nil {
		return err
	}

	subscription.Status = models.SubStatusCancelled
	subscription.AutoRenew = false
	return s.subscriptionRepo.Update(subscription)
}

func (s *subscriptionService) Renew(id uuid.UUID) error {
	subscription, err := s.subscriptionRepo.GetByID(id)
	if err != nil {
		return err
	}

	if subscription.Status == models.SubStatusActive && subscription.EndDate.After(time.Now()) {
		subscription.EndDate = subscription.EndDate.AddDate(0, 1, 0)
	} else {
		subscription.Status = models.SubStatusActive
		subscription.StartDate = time.Now()
		subscription.EndDate = time.Now().AddDate(0, 1, 0)
	}

	return s.subscriptionRepo.Update(subscription)
}

func (s *subscriptionService) GetPlans() []models.SubscriptionPlanConfig {
	return models.SubscriptionPlans
}

func (s *subscriptionService) getPlanConfig(plan models.SubscriptionPlan) *models.SubscriptionPlanConfig {
	for _, p := range models.SubscriptionPlans {
		if p.Plan == plan {
			return &p
		}
	}
	return nil
}
