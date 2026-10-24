package entities

type CourseProgress struct {
	TrackId string `json:"track_id"`
	Done    bool   `json:"is_done"`
}
