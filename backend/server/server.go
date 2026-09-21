package server

import (
	"net/http"

	"codeberg.org/iklabib/swadidik/entities"
	"codeberg.org/iklabib/swadidik/handlers"
	middlewares "codeberg.org/iklabib/swadidik/middlewares"
)

func NewServer(cfg entities.JwtConfig) http.Handler {
	authHandlers := handlers.Auth{Cfg: cfg}

	mux := http.NewServeMux()
	mux.HandleFunc("POST /auth/token", authHandlers.TokenHandler)
	mux.HandleFunc("POST /auth/refresh", authHandlers.RefreshTokenHandler)

	RequireTokenMiddleware := middlewares.RequireAccessToken(cfg)

	mux.Handle("POST /invoke/run", RequireTokenMiddleware(http.HandlerFunc(handlers.RunHandler)))

	return mux
}
