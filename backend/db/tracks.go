package db

import (
	"database/sql"
	"errors"
	"log/slog"
)

type Track struct {
	Uuid     string  `json:"uuid"`
	Order    int     `json:"order"`
	Title    string  `json:"title"`
	Material *string `json:"material"`
}

var ErrTrackNotFound = errors.New("track not found")

func InsertTrack(db *sql.DB, track int, title string, course_id string) error {
	sql := `INSERT INTO public.tracks (track, title, course_id) VALUES (?, ?, ?)`
	_, err := db.Exec(sql, track, title, course_id)
	return err
}

func GetTracks(db *sql.DB, courseId string) ([]Track, error) {
	sql := `
	SELECT uuid, "order", title 
	FROM tracks 
	WHERE course_id = $1 
	ORDER BY "order"`

	var tracks []Track

	rows, err := db.Query(sql, courseId)
	if err != nil {
		slog.Error(err.Error())
		return tracks, err
	}
	defer rows.Close()

	if rows.Err() != nil {
		slog.Error(rows.Err().Error())
		return tracks, rows.Err()
	}

	for rows.Next() {
		var each = Track{}
		rows.Scan(&each.Uuid, &each.Order, &each.Title)
		tracks = append(tracks, each)
	}

	return tracks, nil
}

func GetTracksWithMaterial(db *sql.DB, courseId string) ([]Track, error) {
	sql := `
	SELECT uuid, "order", title, material
	FROM tracks 
	WHERE course_id = $1 
	ORDER BY "order"`

	var tracks []Track

	rows, err := db.Query(sql, courseId)
	if err != nil {
		slog.Error(err.Error())
		return tracks, err
	}
	defer rows.Close()

	if rows.Err() != nil {
		slog.Error(rows.Err().Error())
		return tracks, rows.Err()
	}

	for rows.Next() {
		var each = Track{}
		rows.Scan(&each.Uuid, &each.Order, &each.Title, &each.Material)
		tracks = append(tracks, each)
	}

	return tracks, nil
}

func GetSingleTrack(db *sql.DB, trackUuid string) *Track {
	sql := `
	SELECT uuid, "order", title, material
	FROM tracks 
	WHERE uuid=$1`

	var track Track

	row := db.QueryRow(sql, trackUuid)
	if row == nil && row.Err() != nil {
		return nil
	}

	row.Scan(&track.Uuid, &track.Order, &track.Title, &track.Material)

	return &track
}
