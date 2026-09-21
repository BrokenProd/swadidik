package handlers

import (
	"crypto/rand"
	"encoding/json"
	"net/http"
	"time"

	"codeberg.org/iklabib/swadidik/entities"
	"codeberg.org/iklabib/swadidik/utils"
	"github.com/golang-jwt/jwt/v5"
)

const (
	accessTokenLifetime  = 15 * time.Minute
	refreshTokenLifetime = 7 * 24 * time.Hour

	tokenTypeAccess  = "access"
	tokenTypeRefresh = "refresh"
)

type Auth struct {
	Cfg entities.JwtConfig
}

func (auth Auth) TokenHandler(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	var req entities.TokenRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil || req.UserName == "" {
		utils.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid token request"})
		return
	}

	resp, err := auth.issueTokenPair(req.UserName)
	if err != nil {
		utils.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not generate token"})
		return
	}

	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Pragma", "no-cache")
	utils.WriteJSON(w, http.StatusCreated, resp)
}

func (auth Auth) RefreshTokenHandler(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	var req entities.RefreshTokenRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil || req.RefreshToken == "" {
		utils.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid refresh token request"})
		return
	}

	claims, err := utils.ParseToken(req.RefreshToken, tokenTypeRefresh, auth.Cfg)
	if err != nil {
		utils.WriteJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid or expired refresh token"})
		return
	}

	resp, err := auth.issueTokenPair(claims.Subject)
	if err != nil {
		utils.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not generate token"})
		return
	}

	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Pragma", "no-cache")
	utils.WriteJSON(w, http.StatusOK, resp)
}

func (auth Auth) issueTokenPair(user string) (entities.TokenResponse, error) {
	now := time.Now()
	accessExp := now.Add(accessTokenLifetime)

	access, err := auth.signToken(user, tokenTypeAccess, now, accessExp)
	if err != nil {
		return entities.TokenResponse{}, err
	}

	refresh, err := auth.signToken(user, tokenTypeRefresh, now, now.Add(refreshTokenLifetime))
	if err != nil {
		return entities.TokenResponse{}, err
	}

	res := entities.TokenResponse{
		AccessToken:  access,
		RefreshToken: refresh,
		ExpiresAt:    accessExp.Unix(),
	}
	return res, nil
}

func (auth Auth) signToken(user, tokenType string, iat, exp time.Time) (string, error) {
	jti := rand.Text()
	claims := entities.Claims{
		TokenType: tokenType,
		Subject:   user,
		Issuer:    auth.Cfg.Issuer,
		Audience:  jwt.ClaimStrings{auth.Cfg.Audience},
		ID:        jti,
		IssuedAt:  jwt.NewNumericDate(iat),
		NotBefore: jwt.NewNumericDate(iat),
		ExpiresAt: jwt.NewNumericDate(exp),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(auth.Cfg.Secret)
}
