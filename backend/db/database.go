package db

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"sync"
	"time"

	_ "github.com/lib/pq"
)

const (
	maxOpenConnections    = 20
	maxIdleConnections    = 5
	connectionMaxLifetime = 60 * time.Minute
	connectionMaxIdleTime = 20 * time.Minute
)

var (
	dbInstance *sql.DB
	initOnce   sync.Once
)

func Connect(databaseUrl string) (*sql.DB, error) {
	var err error

	initOnce.Do(func() {
		if databaseUrl == "" {
			err = errors.New("DATABASE_URL is required")
			return
		}

		database, openErr := sql.Open("postgres", databaseUrl)
		if openErr != nil {
			err = fmt.Errorf("open PostgreSQL connection: %w", openErr)
			return
		}

		database.SetMaxOpenConns(maxOpenConnections)
		database.SetMaxIdleConns(maxIdleConnections)
		database.SetConnMaxLifetime(connectionMaxLifetime)
		database.SetConnMaxIdleTime(connectionMaxIdleTime)

		ctx := context.Background()
		if pingErr := database.PingContext(ctx); pingErr != nil {
			database.Close()
			err = fmt.Errorf("ping PostgreSQL: %w", pingErr)
			return
		}

		dbInstance = database
	})

	if err != nil {
		return nil, err
	}

	if dbInstance == nil {
		return nil, errors.New("database initialization failed previously")
	}

	return dbInstance, nil
}
