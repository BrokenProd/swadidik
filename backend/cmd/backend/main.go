package main

import (
	"errors"
	"log/slog"
	"net/http"
	"os"
	"time"

	"codeberg.org/iklabib/swadidik/db"
	"codeberg.org/iklabib/swadidik/entities"
	"codeberg.org/iklabib/swadidik/server"
)

func main() {
	databaseUrl := os.Getenv("DATABASE_URL")
	database, err := db.Connect(databaseUrl)
	if err != nil {
		panic("failed to connect to PostgreSQL: " + err.Error())
	}
	defer database.Close()

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		panic("empty JWT secret")
	}

	if secret := []byte(jwtSecret); len(secret) < 32 {
		panic("JWT secret length need atleast 32 bytes")
	}

	jwtIssuer := os.Getenv("JWT_ISSUER")
	if jwtIssuer == "" {
		panic("empty JWT issuer")
	}

	jwtAudience := os.Getenv("JWT_AUDIENCE")
	if jwtAudience == "" {
		panic("empty JWT audience")
	}

	config := entities.Config{
		Secret:   []byte(jwtSecret),
		Issuer:   jwtIssuer,
		Audience: jwtAudience,
	}

	server := &http.Server{
		Addr:              ":8080",
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
		Handler:           server.NewServer(config, database),
	}

	slog.Info("starting at " + server.Addr)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		slog.Error("failed to start server", "error", err)
	}
}
