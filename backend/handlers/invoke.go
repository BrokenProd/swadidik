package handlers

import (
	"net/http"

	"github.com/labstack/echo/v5"
)

func RunHandler(c *echo.Context) error {
	c.Response().Header().Set("Cache-Control", "no-store")
	c.Response().Header().Set("Pragma", "no-cache")
	return c.JSON(http.StatusOK, "run!")
}
