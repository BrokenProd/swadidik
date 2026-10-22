package db

import (
	"database/sql"
	"errors"
	"log/slog"
)

type Track struct {
	Uuid     string `json:"uuid"`
	Track    int    `json:"track"`
	Title    string `json:"title"`
	CourseId string `json:"course_id"`
}

var ErrTrackNotFound = errors.New("track not found")

func InsertTrack(db *sql.DB, track int, title string, course_id string) error {
	sql := `INSERT INTO public.tracks (track, title, course_id) VALUES (?, ?, ?)`
	_, err := db.Exec(sql, track, title, course_id)
	return err
}

func GetTracks(db *sql.DB, courseId string) ([]Track, error) {
	sql := `SELECT uuid, track, title
			FROM tracks 
			WHERE course_id = $1`

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
		var each = Track{CourseId: courseId}
		rows.Scan(&each.Uuid, &each.Track, &each.Title)
		tracks = append(tracks, each)
	}

	return tracks, nil
}

func GetTrackBound(db *sql.DB, courseId string) int {
	query := `SELECT COALESCE(MAX(track), 0) FROM tracks WHERE course_id = $1`
	var count int
	err := db.QueryRow(query, courseId).Scan(&count)

	if err == sql.ErrNoRows {
		return 0
	}

	if err != nil {
		slog.Error("GetTrackBound failed: course_id=%s, err=%v", courseId, err)
		return 0
	}
	return count
}
