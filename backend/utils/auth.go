package utils

import (
	"crypto/rand"
	"errors"
	"fmt"
	"time"

	"codeberg.org/iklabib/swadidik/entities"
	"github.com/golang-jwt/jwt/v5"
)

func IssueNewToken(subject string,
	tokenType string,
	issuedAt,
	expiresAt time.Time,
	config entities.Config) (string, error) {
	claims := entities.Claims{
		TokenType: tokenType,
		Subject:   subject,
		Issuer:    config.Issuer,
		Audience:  jwt.ClaimStrings{config.Audience},
		ID:        rand.Text(),
		IssuedAt:  jwt.NewNumericDate(issuedAt),
		NotBefore: jwt.NewNumericDate(issuedAt),
		ExpiresAt: jwt.NewNumericDate(expiresAt),
	}

	newClaims := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	if newClaims == nil {
		panic("new claims is nil")
	}

	return newClaims.SignedString(config.Secret)
}

func Claim(auth string, config entities.Config) (*jwt.Token, *entities.Claims, error) {
	keyFunc := func(t *jwt.Token) (interface{}, error) {
		if t.Method.Alg() != "HS256" {
			return nil, fmt.Errorf("unexpected jwt signing method=%v", t.Header["alg"])
		}
		return config.Secret, nil
	}

	claims := &entities.Claims{}
	token, err := jwt.ParseWithClaims(auth,
		claims,
		keyFunc,
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithIssuer(config.Issuer),
		jwt.WithAudience(config.Audience),
		jwt.WithExpirationRequired())

	return token, claims, err
}

func VerifyJwt(auth, tokenType string, config entities.Config) (*entities.Claims, error) {
	token, claims, err := Claim(auth, config)
	if err != nil {
		return nil, err
	}

	if !token.Valid || claims.TokenType != tokenType || claims.Subject == "" {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}
