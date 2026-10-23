package handlers

import (
	"fmt"
	"io"
	"net/http"
	"strings"

	"codeberg.org/iklabib/swadidik/storage"
	"github.com/labstack/echo/v5"
)

type WorkspaceFile struct {
	FilePath string `json:"filePath"`
	Content  string `json:"content"`
}

func FilesHandler(s3 *storage.S3Client) echo.HandlerFunc {
	return func(c *echo.Context) error {
		ctx := c.Request().Context()

		courseId := c.QueryParam("course_id")
		uuid := c.QueryParam("uuid") // uuid for track

		if courseId == "" || uuid == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "missing required parameters 'uuid' or 'course id'",
			})
		}

		prefix := fmt.Sprintf("materials/%s/%s", strings.Trim(courseId, "/"), strings.Trim(uuid, "/"))

		objects, err := s3.FetchFilesByPrefix(ctx, "swadidik", prefix)
		if err != nil {
			return c.JSON(http.StatusInternalServerError,
				map[string]string{"error": "could not fetch files: " + err.Error()})
		}

		files := []WorkspaceFile{}

		for _, obj := range objects {
			if strings.HasSuffix(obj.Key, "/") {
				continue
			}

			prefixWithSlash := prefix + "/"
			if !strings.HasPrefix(obj.Key, prefixWithSlash) {
				continue
			}

			relPath := strings.TrimPrefix(obj.Key, prefixWithSlash)
			res, err := s3.GetObject(ctx, "swadidik", obj.Key)
			if err != nil || res == nil {
				return c.JSON(http.StatusInternalServerError,
					map[string]string{"error": "could not fetch object content"})
			}

			content, err := io.ReadAll(res.Body)
			res.Body.Close()
			if err != nil {
				return c.JSON(http.StatusInternalServerError,
					map[string]string{"error": "could not read object body"})
			}

			files = append(files, WorkspaceFile{
				FilePath: relPath,
				Content:  string(content),
			})
		}

		return c.JSON(http.StatusOK, map[string][]WorkspaceFile{"files": files})
	}
}
