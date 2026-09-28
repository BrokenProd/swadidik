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

	jwtService := utils.NewJWTService(config)

	authGroup := e.Group("/auth")
	authGroup.POST("/token", handlers.TokenHandler(jwtService))
	authGroup.POST("/refresh", handlers.RefreshTokenHandler(jwtService))

	jwtMiddleware := echojwt.Config{
		ParseTokenFunc: func(c *echo.Context, auth string) (interface{}, error) {
			return jwtService.Verify(auth, "access")
		},
	}

	invoke := e.Group("/invoke")
	invoke.Use(echojwt.WithConfig(jwtMiddleware))
	invoke.POST("/run", handlers.RunHandler)

	return e
}
