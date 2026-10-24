package handlers

import (
	"database/sql"
	"net/http"

	"codeberg.org/iklabib/swadidik/db"
	"codeberg.org/iklabib/swadidik/entities"
	"codeberg.org/iklabib/swadidik/utils"
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

func CourseProgressHandlers(jwtService utils.JWTService, database *sql.DB) echo.HandlerFunc {
	return func(c *echo.Context) error {
		cookie, err := c.Cookie(accessCookieName)
		if err != nil {
			return c.NoContent(http.StatusUnauthorized)
		}

		var course entities.CourseProgress
		if err := c.Bind(&course); err != nil {
			return c.JSON(http.StatusBadRequest, err.Error())
		}

		claims, err := jwtService.Verify(cookie.Value, "access")
		if err != nil {
			return c.NoContent(http.StatusUnauthorized)
		}

		err = db.MarkProgress(c.Request().Context(), database, course.TrackId, course.Done, claims.ID)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, err.Error())
		}

		return c.NoContent(200)
	}
}

func GetCourseProgressHandler(jwtService utils.JWTService, database *sql.DB) echo.HandlerFunc {
	return func(c *echo.Context) error {
		cookie, err := c.Cookie(accessCookieName)
		if err != nil {
			return c.NoContent(http.StatusUnauthorized)
		}

		claims, err := jwtService.Verify(cookie.Value, "access")
		if err != nil {
			return c.NoContent(http.StatusUnauthorized)
		}

		progress, err := db.GetCourseProgress(c.Request().Context(), database, claims.ID)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, err.Error())
		}

		return c.JSON(http.StatusOK, progress)
	}
}
