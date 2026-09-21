package handlers

import (
	"net/http"
	"time"

	"codeberg.org/iklabib/swadidik/entities"
	"codeberg.org/iklabib/swadidik/utils"
	"github.com/labstack/echo/v5"
)

const (
	accessTokenLifetime  = 30 * time.Minute
	refreshTokenLifetime = 7 * 24 * time.Hour
	tokenTypeAccess      = "access"
	tokenTypeRefresh     = "refresh"
)

var defaultRoles = []string{"user"}

type Auth struct {
	Config entities.Config
}

func (a Auth) TokenHandler(c *echo.Context) error {
	var req entities.TokenRequest
	if err := c.Bind(&req); err != nil || req.UserName == "" {
		return c.JSON(http.StatusBadRequest,
			map[string]string{"error": "invalid token request"})
	}

	resp, err := a.issueTokenPair(req.UserName)
	if err != nil {
		return c.JSON(http.StatusInternalServerError,
			map[string]string{"error": "could not generate token"})
	}

	c.Response().Header().Set("Cache-Control", "no-store")
	c.Response().Header().Set("Pragma", "no-cache")

	return c.JSON(http.StatusOK, resp)
}

func (a Auth) RefreshTokenHandler(c *echo.Context) error {
	var req entities.RefreshTokenRequest
	if err := c.Bind(&req); err != nil || req.RefreshToken == "" {
		return c.JSON(http.StatusBadRequest,
			map[string]string{"error": "invalid refresh token request"})
	}

	claims, err := utils.VerifyJwt(req.RefreshToken, tokenTypeRefresh, a.Config)
	if err != nil {
		return c.JSON(http.StatusUnauthorized,
			map[string]string{"error": "invalid or expired refresh token"})
	}

	resp, err := a.issueTokenPair(claims.Subject)
	if err != nil {
		return c.JSON(http.StatusInternalServerError,
			map[string]string{"error": "could not generate token"})
	}

	c.Response().Header().Set("Cache-Control", "no-store")
	c.Response().Header().Set("Pragma", "no-cache")

	return c.JSON(http.StatusOK, resp)
}

func (a Auth) issueTokenPair(user string) (entities.TokenResponse, error) {
	now := time.Now()
	accessExpiresAt := now.Add(accessTokenLifetime)
	access, err := utils.IssueNewToken(user, tokenTypeAccess, now, accessExpiresAt, a.Config)
	if err != nil {
		return entities.TokenResponse{}, err
	}

	refresh, err := utils.IssueNewToken(user,
		tokenTypeRefresh,
		now,
		now.Add(refreshTokenLifetime),
		a.Config)

	if err != nil {
		return entities.TokenResponse{}, err
	}

	tokenResp := entities.TokenResponse{
		AccessToken:  access,
		RefreshToken: refresh,
		ExpiresAt:    accessExpiresAt.Unix(),
		Roles:        defaultRoles,
	}

	return tokenResp, nil
}
