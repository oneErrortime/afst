package gorm_test

import (
	"testing"

	"github.com/oneErrortime/afst/internal/models"
	"github.com/oneErrortime/afst/internal/repository/gorm"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	assert.NoError(t, err)
	
	// Миграция только для модели FeatureFlag
	err = db.AutoMigrate(&models.FeatureFlag{})
	assert.NoError(t, err)
	
	return db
}

func TestFeatureFlagRepository(t *testing.T) {
	db := setupTestDB(t)
	repo := gorm.NewFeatureFlagRepository(db)

	// 1. Создание флага
	flag1 := &models.FeatureFlag{
		Name:        "enable_analytics",
		Description: "Включение сбора аналитики",
		Type:        models.TypeBoolean,
		Value:       "true",
		IsActive:    true,
	}
	err := repo.Create(flag1)
	assert.NoError(t, err)
	assert.NotEqual(t, models.FeatureFlag{}, flag1.ID)

	// 2. Получение флага по имени
	foundFlag, err := repo.GetByName("enable_analytics")
	assert.NoError(t, err)
	assert.Equal(t, flag1.Name, foundFlag.Name)
	assert.Equal(t, "true", foundFlag.Value)

	// 3. Обновление флага
	foundFlag.Value = "false"
	foundFlag.IsActive = false
	err = repo.Update(foundFlag)
	assert.NoError(t, err)

	updatedFlag, err := repo.GetByName("enable_analytics")
	assert.NoError(t, err, "Не удалось получить обновленный флаг")
	assert.Equal(t, "false", updatedFlag.Value)
	assert.False(t, updatedFlag.IsActive)

	// 4. Создание второго флага
	flag2 := &models.FeatureFlag{
		Name:        "max_users",
		Description: "Максимальное количество пользователей",
		Type:        models.TypeInteger,
		Value:       "1000",
		IsActive:    true,
	}
	err = repo.Create(flag2)
	assert.NoError(t, err)

	// 5. Получение всех флагов
	allFlags, err := repo.GetAll()
	assert.NoError(t, err)
	assert.Len(t, allFlags, 2)
	
	// 6. Получение несуществующего флага
	_, err = repo.GetByName("non_existent_flag")
	assert.Error(t, err)
	assert.Equal(t, gorm.ErrRecordNotFound, err)
}
