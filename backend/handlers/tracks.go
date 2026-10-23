package handlers

import (
	"database/sql"
	"net/http"

	"codeberg.org/iklabib/swadidik/db"
	"github.com/labstack/echo/v5"
)

func TracksHandler(database *sql.DB) echo.HandlerFunc {
	return func(c *echo.Context) error {
		courseId := c.QueryParam("course_id")
		tracks, err := db.GetTracks(database, courseId)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, "failed to get tracks")
		}

		return c.JSON(http.StatusOK, tracks)
	}
}
