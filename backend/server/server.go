package server

import (
	"codeberg.org/iklabib/swadidik/entities"
	"codeberg.org/iklabib/swadidik/handlers"
	"codeberg.org/iklabib/swadidik/storage"
	"codeberg.org/iklabib/swadidik/utils"
	echojwt "github.com/labstack/echo-jwt/v5"
	"github.com/labstack/echo/v5"
	echomiddleware "github.com/labstack/echo/v5/middleware"
)

func NewServer(config entities.Config) *echo.Echo {
	e := echo.New()
	e.Use(echomiddleware.BodyLimit(1 << 20))
	e.Use(echomiddleware.Recover())
	e.Use(echomiddleware.CORS("http://localhost:5173", "*"))

	jwtService := utils.NewJWTService(config)

	authGroup := e.Group("/auth")
	authGroup.POST("/token", handlers.TokenHandler(jwtService))
	authGroup.POST("/refresh", handlers.RefreshTokenHandler(jwtService))

	jwtMiddleware := echojwt.Config{
		ParseTokenFunc: func(c *echo.Context, auth string) (interface{}, error) {
			return jwtService.Verify(auth, "access")
		},
	}

	invokeGroup := e.Group("/invoke")
	invokeGroup.Use(echojwt.WithConfig(jwtMiddleware))
	invokeGroup.POST("/run", handlers.RunHandler)

	s3client := storage.NewDefault()

	filesGroup := e.Group("/files")
	filesGroup.Use(echojwt.WithConfig(jwtMiddleware))
	filesGroup.GET("/:id", handlers.FilesHandler(s3client))

	return e
}
