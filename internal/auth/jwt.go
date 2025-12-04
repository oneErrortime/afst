package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"github.com/oneErrortime/afst/internal/models"
)

type JWTService struct {
	secretKey string
	issuer    string
	expiresIn time.Duration
}

type Claims struct {
	UserID  uuid.UUID       `json:"user_id"`
	Email   string          `json:"email"`
	Role    models.UserRole `json:"role"`
	GroupID *uuid.UUID      `json:"group_id,omitempty"`
	jwt.RegisteredClaims
}

func NewJWTService(secretKey string, expiresIn time.Duration) *JWTService {
	return &JWTService{
		secretKey: secretKey,
		issuer:    "library-api",
		expiresIn: expiresIn,
	}
}

func (s *JWTService) GenerateToken(userID uuid.UUID, email string, role models.UserRole, groupID *uuid.UUID) (string, error) {
	claims := Claims{
		UserID:  userID,
		Email:   email,
		Role:    role,
		GroupID: groupID,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    s.issuer,
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.expiresIn)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.secretKey))
}

func (s *JWTService) ValidateToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("неожиданный метод подписи")
		}
		return []byte(s.secretKey), nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("невалидный токен")
	}

	return claims, nil
}
