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

func TokenHandler(jwt utils.JWTService) echo.HandlerFunc {
	return func(c *echo.Context) error {
		var req entities.TokenRequest
		if err := c.Bind(&req); err != nil || req.UserName == "" {
			return c.JSON(http.StatusBadRequest,
				map[string]string{"error": "invalid token request"})
		}

		resp, err := issueTokenPair(jwt, req.UserName)
		if err != nil {
			return c.JSON(http.StatusInternalServerError,
				map[string]string{"error": "could not generate token"})
		}

		setNoStoreHeaders(c)
		return c.JSON(http.StatusOK, resp)
	}
}

func RefreshTokenHandler(jwt utils.JWTService) echo.HandlerFunc {
	return func(c *echo.Context) error {
		var req entities.RefreshTokenRequest
		if err := c.Bind(&req); err != nil || req.RefreshToken == "" {
			return c.JSON(http.StatusBadRequest,
				map[string]string{"error": "invalid refresh token request"})
		}

		claims, err := jwt.Verify(req.RefreshToken, tokenTypeRefresh)
		if err != nil {
			return c.JSON(http.StatusUnauthorized,
				map[string]string{"error": "invalid or expired refresh token"})
		}

		resp, err := issueTokenPair(jwt, claims.Subject)
		if err != nil {
			return c.JSON(http.StatusInternalServerError,
				map[string]string{"error": "could not generate token"})
		}

		setNoStoreHeaders(c)
		return c.JSON(http.StatusOK, resp)
	}
}

func issueTokenPair(jwt utils.JWTService, user string) (entities.TokenResponse, error) {
	access, accessExpiresAt, err := jwt.Issue(user, tokenTypeAccess, accessTokenLifetime)
	if err != nil {
		return entities.TokenResponse{}, err
	}

	refresh, _, err := jwt.Issue(user, tokenTypeRefresh, refreshTokenLifetime)

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

func setNoStoreHeaders(c *echo.Context) {
	c.Response().Header().Set("Cache-Control", "no-store")
	c.Response().Header().Set("Pragma", "no-cache")
}
