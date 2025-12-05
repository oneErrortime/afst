package services

import (
	"github.com/oneErrortime/afst/internal/repository"
	"log"
	"sync"
	"time"
)

type FeatureFlagService interface {
	IsActive(name string) bool
	StartCacheUpdate(interval time.Duration)
}

type featureFlagService struct {
	repo       repository.FeatureFlagRepository
	flags      map[string]bool
	mu         sync.RWMutex
	ticker     *time.Ticker
	quitSignal chan struct{}
}

func NewFeatureFlagService(repo repository.FeatureFlagRepository) FeatureFlagService {
	s := &featureFlagService{
		repo:       repo,
		flags:      make(map[string]bool),
		quitSignal: make(chan struct{}),
	}
	s.updateCache() // Первоначальное заполнение
	return s
}

func (s *featureFlagService) IsActive(name string) bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.flags[name]
}

func (s *featureFlagService) updateCache() {
	flags, err := s.repo.GetAll()
	if err != nil {
		log.Printf("Ошибка обновления кэша feature flags: %v", err)
		return
	}

	newFlags := make(map[string]bool)
	for _, flag := range flags {
		newFlags[flag.Name] = flag.IsActive
	}

	s.mu.Lock()
	s.flags = newFlags
	s.mu.Unlock()
	log.Println("Кэш feature flags обновлен")
}

func (s *featureFlagService) StartCacheUpdate(interval time.Duration) {
	if s.ticker != nil {
		return // Уже запущено
	}
	s.ticker = time.NewTicker(interval)
	go func() {
		for {
			select {
			case <-s.ticker.C:
				s.updateCache()
			case <-s.quitSignal:
				s.ticker.Stop()
				return
			}
		}
	}()
}

func (s *featureFlagService) StopCacheUpdate() {
	if s.ticker != nil {
		close(s.quitSignal)
		s.ticker = nil
	}
}
