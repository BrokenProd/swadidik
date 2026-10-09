package handlers

import (
	"fmt"
	"net/http"
	"uuid"

	"codeberg.org/iklabib/swadidik/runners"
	"github.com/labstack/echo/v5"
)

func RunHandler(c *echo.Context) error {
	c.Response().Header().Set("Cache-Control", "no-store")
	c.Response().Header().Set("Pragma", "no-cache")

	var runDto runners.RunDto
	if err := c.Bind(&runDto); err != nil {
		return c.String(http.StatusBadRequest, "bad request")
	}

	switch runDto.Language {
	case "python":
		python := runners.NewPython(runDto.Files)
		if err := python.Prep(); err != nil {
			return c.String(http.StatusInternalServerError, "prep error: "+err.Error())
		}

		output, err := python.Run()
		if err != nil {
			return c.String(http.StatusInternalServerError, "run error: "+err.Error())
		}

		resp := runners.RunResponse{
			Id:     uuid.NewV4().String(),
			Output: output,
		}
		return c.JSON(http.StatusOK, resp)

	case "java":
		java := runners.NewJava(runDto.Files)
		if err := java.Prep(); err != nil {
			return c.String(http.StatusInternalServerError, "prep error: "+err.Error())
		}

		if err := java.Build(); err != nil {
			return c.String(http.StatusInternalServerError, "build error: "+err.Error())
		}

		output, err := java.Run()
		if err != nil {
			return c.String(http.StatusInternalServerError, "run error: "+err.Error())
		}

		resp := runners.RunResponse{
			Id:     uuid.NewV4().String(),
			Output: output,
		}
		return c.JSON(http.StatusOK, resp)
	}

	return c.String(http.StatusBadRequest, fmt.Sprintf(`unknown language "%s"`, runDto.Language))
}
