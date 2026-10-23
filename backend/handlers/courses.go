package handlers

import (
	"database/sql"
	"net/http"

	"codeberg.org/iklabib/swadidik/db"
	"github.com/labstack/echo/v5"
)

func CoursesHandlers(database *sql.DB) echo.HandlerFunc {
	return func(c *echo.Context) error {
		courses, err := db.GetCourses(database)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, err.Error())
		}

		return c.JSON(http.StatusOK, courses)
	}
}

func FindCourseHandlers(database *sql.DB) echo.HandlerFunc {
	return func(c *echo.Context) error {
		courseId := c.Param("courseId")
		courses, err := db.GetCourse(database, courseId)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, err.Error())
		}

		return c.JSON(http.StatusOK, courses)
	}
}
