package server

import (
	"codeberg.org/iklabib/swadidik/entities"
	"codeberg.org/iklabib/swadidik/handlers"
	"codeberg.org/iklabib/swadidik/utils"
	echojwt "github.com/labstack/echo-jwt/v5"
	"github.com/labstack/echo/v5"
	echomiddleware "github.com/labstack/echo/v5/middleware"
)

func NewServer(config entities.Config) *echo.Echo {
	e := echo.New()
	e.Use(echomiddleware.BodyLimit(1 << 20))
	e.Use(echomiddleware.Recover())

	authHandlers := handlers.Auth{
		Config: config,
	}

	authGroup := e.Group("/auth")
	authGroup.POST("/token", authHandlers.TokenHandler)
	authGroup.POST("/refresh", authHandlers.RefreshTokenHandler)

	jwtMiddleware := echojwt.Config{
		ParseTokenFunc: func(c *echo.Context, auth string) (interface{}, error) {
			return utils.VerifyJwt(auth, "access", config)
		},
	}

	invoke := e.Group("/invoke")
	invoke.Use(echojwt.WithConfig(jwtMiddleware))
	invoke.POST("/run", handlers.RunHandler)

	return e
}
