package entities

import "github.com/golang-jwt/jwt/v5"

type TokenRequest struct {
	UserName string `json:"username"`
	Password string `json:"password"`
}

type TokenResponse struct {
	AccessToken  string   `json:"access_token"`
	RefreshToken string   `json:"refresh_token"`
	ExpiresAt    int64    `json:"expires_at"`
	Roles        []string `json:"roles,omitempty"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token"`
}

type Claims struct {
	TokenType string   `json:"token_type"`
	Roles     []string `json:"roles,omitempty"`
	jwt.RegisteredClaims
}

type Config struct {
	Secret   []byte
	Issuer   string
	Audience string
}
