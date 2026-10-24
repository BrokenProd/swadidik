package db

import (
	"context"
	"database/sql"
	"uuid"
)

const (
	getCourseProgressQuery = `
		SELECT track_id, is_done
		FROM course_progress
		WHERE user_id = $1
		ORDER BY track_id`

	updateCourseProgressQuery = `
		UPDATE course_progress
		SET is_done = $1
		WHERE track_id = $2 AND user_id = $3`

	insertCourseProgressQuery = `
		INSERT INTO course_progress (track_id, is_done, user_id, uuid)
		VALUES ($1, $2, $3, $4)`
)

type CourseProgress struct {
	TrackID string `json:"track_id"`
	Done    bool   `json:"is_done"`
}

// GetCourseProgress returns all persisted track completion states for a user.
func GetCourseProgress(ctx context.Context, database *sql.DB, userID string) ([]CourseProgress, error) {
	rows, err := database.QueryContext(ctx, getCourseProgressQuery, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	progress := make([]CourseProgress, 0)
	for rows.Next() {
		var item CourseProgress
		if err := rows.Scan(&item.TrackID, &item.Done); err != nil {
			return nil, err
		}
		progress = append(progress, item)
	}

	return progress, rows.Err()
}

// MarkProgress creates or updates a user's completion state for a track.
func MarkProgress(ctx context.Context, database *sql.DB, trackID string, done bool, userID string) error {
	result, err := database.ExecContext(ctx, updateCourseProgressQuery, done, trackID, userID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected > 0 {
		return nil
	}

	_, err = database.ExecContext(ctx, insertCourseProgressQuery, trackID, done, userID, uuid.NewV4().String())
	return err
}
