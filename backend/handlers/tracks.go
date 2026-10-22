package handlers

import (
	"database/sql"
	"net/http"

	"codeberg.org/iklabib/swadidik/db"
	"github.com/labstack/echo/v5"
)

func TracksHandler(database *sql.DB) echo.HandlerFunc {
	return func(c *echo.Context) error {
		uuid := c.QueryParam("uuid")
		tracks, err := db.GetTracks(database, uuid)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, "failed to get tracks")
		}

		return c.JSON(http.StatusOK, tracks)
	}
}

func TracksBoundHandler(database *sql.DB) echo.HandlerFunc {
	return func(c *echo.Context) error {
		uuid := c.QueryParam("uuid")
		bound := db.GetTrackBound(database, uuid)
		return c.JSON(200, map[string]int{"bound": bound})
	}
}
