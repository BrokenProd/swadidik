package db

import (
	"database/sql"
	"errors"
	"time"
)

type Course struct {
	CourseId    string
	Title       string
	Description string
	AuthorId    string
	ExpireAt    *time.Time
}

type CourseMeta struct {
	CourseId    string     `json:"courseId"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	AuthorName  string     `json:"authorName"`
	CreatedAt   time.Time  `json:"createdAt"`
	ExpireAt    *time.Time `json:"expireAt"`
}

// TODO
// paging, visibility (public, private)
func GetCourses(db *sql.DB) ([]CourseMeta, error) {
	query := `SELECT 
				c.course_id, 
				c.title, 
				c.description, 
				u.name as author_name, 
				c.created_at, 
				c.expired_at 
			  FROM courses as c
			  JOIN public.users u ON author_id = u.id`

	result := []CourseMeta{}
	rows, err := db.Query(query)
	if err != nil {
		return result, err
	}
	defer rows.Close()

	for rows.Next() {
		if rows.Err() != nil {
			return result, rows.Err()
		}

		each := CourseMeta{}
		rows.Scan(
			&each.CourseId,
			&each.Title,
			&each.Description,
			&each.AuthorName,
			&each.CreatedAt,
			&each.ExpireAt,
		)
		result = append(result, each)
	}

	return result, nil
}

func GetCourse(db *sql.DB, courseId string) (CourseMeta, error) {
	query := `SELECT 
				c.title, 
				c.description, 
				u.name as author_name, 
				c.created_at, 
				c.expired_at 
			  FROM courses as c
			  JOIN public.users u ON author_id = u.id
			  WHERE course_id = $1`

	course := CourseMeta{CourseId: courseId}
	row := db.QueryRow(query, courseId)

	if row.Err() != nil && !errors.Is(row.Err(), sql.ErrNoRows) {
		return course, row.Err()
	}

	row.Scan(&course.Title,
		&course.Description,
		&course.AuthorName,
		&course.CreatedAt,
		&course.ExpireAt,
	)

	return course, nil
}
