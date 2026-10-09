package entities

import "github.com/golang-jwt/jwt/v5"

type TokenRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Remember bool   `json:"remember"`
}

type TokenResponse struct {
	ExpiresAt int64    `json:"expires_at"`
	Roles     []string `json:"roles,omitempty"`
}

type Claims struct {
	TokenType  string   `json:"token_type"`
	Persistent bool     `json:"persistent"`
	Roles      []string `json:"roles,omitempty"`
	jwt.RegisteredClaims
}

type Config struct {
	Secret   []byte
	Issuer   string
	Audience string
}
