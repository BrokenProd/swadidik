package server

import (
	"database/sql"
	"os"
	"strings"

	"codeberg.org/iklabib/swadidik/entities"
	"codeberg.org/iklabib/swadidik/handlers"
	"codeberg.org/iklabib/swadidik/storage"
	"codeberg.org/iklabib/swadidik/utils"
	echojwt "github.com/labstack/echo-jwt/v5"
	"github.com/labstack/echo/v5"
	echomiddleware "github.com/labstack/echo/v5/middleware"
)

func NewServer(config entities.Config, database *sql.DB) *echo.Echo {
	e := echo.New()
	e.Use(echomiddleware.BodyLimit(1 << 20))
	e.Use(echomiddleware.Recover())

	allowOrigins := []string{}
	if strings.EqualFold(os.Getenv("ENVIRONMENT"), "development") {
		allowOrigins = []string{"http://localhost:5173", "http://localhost:4173"}
	}

	if rawOrigins := os.Getenv("ALLOW_ORIGINS"); rawOrigins != "" {
		allowOrigins = strings.Split(rawOrigins, ",")
		for i := range allowOrigins {
			allowOrigins[i] = strings.TrimSpace(allowOrigins[i])
		}
	}

	e.Use(echomiddleware.CORSWithConfig(echomiddleware.CORSConfig{
		AllowOrigins:     allowOrigins,
		AllowCredentials: true,
	}))

	jwtService := utils.NewJWTService(config)

	authGroup := e.Group("/auth")
	authGroup.POST("/register", handlers.RegisterHandler(database))
	authGroup.POST("/token", handlers.TokenHandler(jwtService, database))
	authGroup.POST("/refresh", handlers.RefreshTokenHandler(jwtService))
	authGroup.POST("/logout", handlers.LogoutHandler())

	jwtMiddleware := echojwt.Config{
		TokenLookup: "cookie:access_token",
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
	filesGroup.GET("/", handlers.FilesHandler(s3client))

	tracksGroup := e.Group("/tracks")
	tracksGroup.Use(echojwt.WithConfig(jwtMiddleware))
	tracksGroup.GET("/", handlers.TracksHandler(database))
	tracksGroup.GET("/bound", handlers.TracksBoundHandler(database))

	return e
}
