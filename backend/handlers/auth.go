package handlers

import (
	"database/sql"
	"errors"
	"net/http"
	"os"
	"strings"
	"time"

	"codeberg.org/iklabib/swadidik/db"
	"codeberg.org/iklabib/swadidik/entities"
	"codeberg.org/iklabib/swadidik/utils"
	"github.com/labstack/echo/v5"
	"golang.org/x/crypto/bcrypt"
)

const (
	accessTokenLifetime  = 30 * time.Minute
	refreshTokenLifetime = 7 * 24 * time.Hour
	tokenTypeAccess      = "access"
	tokenTypeRefresh     = "refresh"
	accessCookieName     = "access_token"
	refreshCookieName    = "refresh_token"
)

var defaultRoles = []string{"user"}

func TokenHandler(jwt utils.JWTService, database *sql.DB) echo.HandlerFunc {
	return func(c *echo.Context) error {
		var req entities.TokenRequest
		if err := c.Bind(&req); err != nil || req.Email == "" || req.Password == "" {
			return c.JSON(http.StatusBadRequest,
				map[string]string{"error": "invalid token request"})
		}

		email := strings.ToLower(strings.TrimSpace(req.Email))
		user, err := db.FindUserByEmail(c.Request().Context(), database, email)
		if errors.Is(err, db.ErrUserNotFound) {
			return c.JSON(http.StatusUnauthorized,
				map[string]string{"error": "email or password is incorrect"})
		}

		if err != nil {
			return c.JSON(http.StatusInternalServerError,
				map[string]string{"error": "could not authenticate account"})
		}

		if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)) != nil {
			return c.JSON(http.StatusUnauthorized,
				map[string]string{"error": "email or password is incorrect"})
		}

		resp, err := issueTokenPair(jwt, user.Email, req.Remember)
		if err != nil {
			return c.JSON(http.StatusInternalServerError,
				map[string]string{"error": "could not generate token"})
		}

		setTokenCookies(c, resp)
		setNoStoreHeaders(c)
		return c.JSON(http.StatusOK, resp)
	}
}

func RefreshTokenHandler(jwt utils.JWTService) echo.HandlerFunc {
	return func(c *echo.Context) error {
		refreshCookie, err := c.Cookie(refreshCookieName)
		if err != nil || refreshCookie.Value == "" {
			return c.JSON(http.StatusBadRequest,
				map[string]string{"error": "invalid refresh token request"})
		}

		claims, err := jwt.Verify(refreshCookie.Value, tokenTypeRefresh)
		if err != nil {
			return c.JSON(http.StatusUnauthorized,
				map[string]string{"error": "invalid or expired refresh token"})
		}

		resp, err := issueTokenPair(jwt, claims.Subject, claims.Persistent)
		if err != nil {
			return c.JSON(http.StatusInternalServerError,
				map[string]string{"error": "could not generate token"})
		}

		setTokenCookies(c, resp)
		setNoStoreHeaders(c)
		return c.JSON(http.StatusOK, resp)
	}
}

func LogoutHandler() echo.HandlerFunc {
	return func(c *echo.Context) error {
		clearTokenCookies(c)
		setNoStoreHeaders(c)
		return c.NoContent(http.StatusNoContent)
	}
}

type tokenPair struct {
	entities.TokenResponse
	accessToken  string
	refreshToken string
	persistent   bool
}

func issueTokenPair(jwt utils.JWTService, email string, persistent bool) (tokenPair, error) {
	access, accessExpiresAt, err := jwt.Issue(email, tokenTypeAccess, accessTokenLifetime, persistent)
	if err != nil {
		return tokenPair{}, err
	}

	refresh, _, err := jwt.Issue(email, tokenTypeRefresh, refreshTokenLifetime, persistent)

	if err != nil {
		return tokenPair{}, err
	}

	return tokenPair{
		ExpiresAt:    accessExpiresAt.Unix(),
		Roles:        defaultRoles,
		accessToken:  access,
		refreshToken: refresh,
		persistent:   persistent,
	}, nil
}

func setTokenCookies(c *echo.Context, tokens tokenPair) {
	accessCookie := &http.Cookie{
		Name:     accessCookieName,
		Value:    tokens.accessToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: tokenCookieSameSite(),
	}
	refreshCookie := &http.Cookie{
		Name:     refreshCookieName,
		Value:    tokens.refreshToken,
		Path:     "/auth",
		HttpOnly: true,
		Secure:   true,
		SameSite: tokenCookieSameSite(),
	}

	if tokens.persistent {
		accessCookie.MaxAge = int(accessTokenLifetime.Seconds())
		refreshCookie.MaxAge = int(refreshTokenLifetime.Seconds())
	}

	c.SetCookie(accessCookie)
	c.SetCookie(refreshCookie)
}

func clearTokenCookies(c *echo.Context) {
	expiresAt := time.Unix(0, 0)
	c.SetCookie(&http.Cookie{
		Name:     accessCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: tokenCookieSameSite(),
		MaxAge:   -1,
		Expires:  expiresAt,
	})
	c.SetCookie(&http.Cookie{
		Name:     refreshCookieName,
		Value:    "",
		Path:     "/auth",
		HttpOnly: true,
		Secure:   true,
		SameSite: tokenCookieSameSite(),
		MaxAge:   -1,
		Expires:  expiresAt,
	})
}

// tokenCookieSameSite defaults to Lax for same-site deployments. Set
// COOKIE_SAME_SITE=none when the browser app and API are on different sites;
// Secure must remain enabled for SameSite=None cookies.
func tokenCookieSameSite() http.SameSite {
	switch strings.ToLower(strings.TrimSpace(os.Getenv("COOKIE_SAME_SITE"))) {
	case "none":
		return http.SameSiteNoneMode
	case "strict":
		return http.SameSiteStrictMode
	default:
		return http.SameSiteLaxMode
	}
}

func setNoStoreHeaders(c *echo.Context) {
	c.Response().Header().Set("Cache-Control", "no-store")
	c.Response().Header().Set("Pragma", "no-cache")
}
