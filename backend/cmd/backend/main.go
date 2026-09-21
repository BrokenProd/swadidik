package main

import (
	"errors"
	"log/slog"
	"net/http"
	"os"

	backend "codeberg.org/iklabib/swadidik"
)

func main() {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		panic("empty JWT secret")
	}

	server := &http.Server{
		Addr:    ":8080",
		Handler: backend.NewServer([]byte(jwtSecret)),
	}

	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		slog.Error("failed to start server", "error", err)
	}
}
