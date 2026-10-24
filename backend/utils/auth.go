package utils

import (
	"errors"
	"fmt"
	"time"

	"codeberg.org/iklabib/swadidik/entities"
	"github.com/golang-jwt/jwt/v5"
)

type JWTService struct {
	config entities.Config
}

func NewJWTService(config entities.Config) JWTService {
	return JWTService{config: config}
}

func (s JWTService) Issue(userId, subject, tokenType string, lifetime time.Duration, persistent bool) (string, time.Time, error) {
	issuedAt := time.Now()
	expiresAt := issuedAt.Add(lifetime)
	claims := entities.Claims{
		TokenType:  tokenType,
		Persistent: persistent,
		Subject:    subject,
		Issuer:     s.config.Issuer,
		Audience:   jwt.ClaimStrings{s.config.Audience},
		ID:         userId,
		IssuedAt:   jwt.NewNumericDate(issuedAt),
		NotBefore:  jwt.NewNumericDate(issuedAt),
		ExpiresAt:  jwt.NewNumericDate(expiresAt),
	}

	newClaims := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	if newClaims == nil {
		panic("new claims is nil")
	}

	token, err := newClaims.SignedString(s.config.Secret)
	return token, expiresAt, err
}

func (s JWTService) Claim(auth string) (*jwt.Token, *entities.Claims, error) {
	keyFunc := func(t *jwt.Token) (interface{}, error) {
		if t.Method.Alg() != "HS256" {
			return nil, fmt.Errorf("unexpected jwt signing method=%v", t.Header["alg"])
		}
		return s.config.Secret, nil
	}

	claims := &entities.Claims{}
	token, err := jwt.ParseWithClaims(auth,
		claims,
		keyFunc,
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithIssuer(s.config.Issuer),
		jwt.WithAudience(s.config.Audience),
		jwt.WithExpirationRequired())

	return token, claims, err
}

func (s JWTService) Verify(auth, tokenType string) (*entities.Claims, error) {
	token, claims, err := s.Claim(auth)
	if err != nil {
		return nil, err
	}

	if !token.Valid || claims.TokenType != tokenType || claims.Subject == "" {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}
