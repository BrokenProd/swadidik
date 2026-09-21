package utils

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func Claim(jwtSecret []byte, bearerToken string) (jwt.MapClaims, error) {
	claims := jwt.MapClaims{}

	// split bearer <token>
	parts := strings.Fields(bearerToken)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || parts[1] == "" {
		return claims, errors.New("missing bearer token")
	}

	// <token> part
	raw := parts[1]

	keyFunc := func(*jwt.Token) (any, error) {
		return jwtSecret, nil
	}

	token, err := jwt.ParseWithClaims(raw, claims,
		keyFunc,
		jwt.WithValidMethods([]string{"HS256"}),
		jwt.WithExpirationRequired(),
		jwt.WithLeeway(5*time.Second),
	)
	if err != nil || !token.Valid {
		return nil, errors.New("invalid or expired token")
	}

	return claims, nil
}

func WriteJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(value); err != nil {
		slog.Error("failed to write JSON response", "error", err)
	}
}
