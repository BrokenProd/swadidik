package db

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
)

type Track struct {
	Uuid   string `json:"uuid"`
	Track  int    `json:"track"`
	UserId string `json:"user_id"`
}

var ErrTrackNotFound = errors.New("track not found")

func Insert(ctx context.Context, database *sql.DB, track Track) (Track, error) {
	const query = `
		INSERT INTO tracks (uuid, track, user_id)
		VALUES ($1, $2, $3)
		RETURNING uuid, track, user_id`

	var created Track
	err := database.QueryRowContext(ctx, query, track.Uuid, track.Track, track.UserId).Scan(
		&created.Uuid,
		&created.Track,
		&created.UserId,
	)
	if err != nil {
		return Track{}, fmt.Errorf("insert track: %w", err)
	}

	return created, nil
}

func FindByUUID(ctx context.Context, database *sql.DB, uuid string) (Track, error) {
	const query = `
		SELECT uuid, track, user_id
		FROM tracks
		WHERE uuid = $1`

	var track Track
	err := database.QueryRowContext(ctx, query, uuid).Scan(
		&track.Uuid,
		&track.Track,
		&track.UserId,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return Track{}, ErrTrackNotFound
	}
	if err != nil {
		return Track{}, fmt.Errorf("find track by UUID: %w", err)
	}

	return track, nil
}

func Update(ctx context.Context, database *sql.DB, track Track) (Track, error) {
	const query = `
		UPDATE tracks
		SET track = $2, user_id = $3
		WHERE uuid = $1
		RETURNING uuid, track, user_id`

	var updated Track
	err := database.QueryRowContext(ctx, query, track.Uuid, track.Track, track.UserId).Scan(
		&updated.Uuid,
		&updated.Track,
		&updated.UserId,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return Track{}, ErrTrackNotFound
	}
	if err != nil {
		return Track{}, fmt.Errorf("update track: %w", err)
	}

	return updated, nil
}

func Delete(ctx context.Context, database *sql.DB, uuid string) error {
	const query = `DELETE FROM tracks WHERE uuid = $1`

	result, err := database.ExecContext(ctx, query, uuid)
	if err != nil {
		return fmt.Errorf("delete track: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("check deleted track: %w", err)
	}
	if rowsAffected == 0 {
		return ErrTrackNotFound
	}

	return nil
}
