package utils

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"codeberg.org/iklabib/swadidik/entities"
	"github.com/golang-jwt/jwt/v5"
)

func WriteJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(value); err != nil {
		slog.Error("failed to write JSON response", "error", err)
	}
}

func ParseToken(token, tokenType string, cfg entities.JwtConfig) (*entities.Claims, error) {
	keyFunc := func(*jwt.Token) (any, error) {
		return cfg.Secret, nil
	}

	claims := &entities.Claims{}
	_, err := jwt.ParseWithClaims(token,
		claims,
		keyFunc,
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithIssuer(cfg.Issuer),
		jwt.WithAudience(cfg.Audience),
		jwt.WithExpirationRequired(),
	)
	if err != nil {
		return nil, err
	}

	if claims.TokenType != tokenType || claims.Subject == "" {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}
