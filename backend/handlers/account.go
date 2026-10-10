package handlers

import (
	"database/sql"
	"errors"
	"net/http"
	"net/mail"
	"strings"

	"codeberg.org/iklabib/swadidik/db"
	"github.com/labstack/echo/v5"
	"golang.org/x/crypto/bcrypt"
)

const (
	minimumPasswordLength = 8
	maximumPasswordLength = 72
	maximumNameLength     = 255
)

type registrationRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func RegisterHandler(database *sql.DB) echo.HandlerFunc {
	return func(c *echo.Context) error {
		var request registrationRequest
		if err := c.Bind(&request); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid registration request"})
		}

		name := strings.TrimSpace(request.Name)
		if name == "" || len([]rune(name)) > maximumNameLength {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "name must be between 1 and 255 characters"})
		}

		email, err := normalizeEmail(request.Email)
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid email address"})
		}

		if len(request.Password) < minimumPasswordLength || len(request.Password) > maximumPasswordLength {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "password must be between 8 and 72 characters",
			})
		}

		passwordHash, err := bcrypt.GenerateFromPassword([]byte(request.Password), bcrypt.DefaultCost)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "could not create account"})
		}

		user, err := db.CreateUser(c.Request().Context(), database, name, email, string(passwordHash))
		if db.IsUniqueViolation(err) {
			return c.JSON(http.StatusConflict, map[string]string{"error": "email is already registered"})
		}

		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "could not create account"})
		}

		return c.JSON(http.StatusCreated, map[string]any{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
		})
	}
}

func normalizeEmail(value string) (string, error) {
	email := strings.ToLower(strings.TrimSpace(value))
	parsed, err := mail.ParseAddress(email)
	if err != nil || parsed.Address != email || len(email) > 255 {
		return "", errors.New("invalid email")
	}
	return email, nil
}
