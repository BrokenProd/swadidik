package handlers

import (
	"io"
	"net/http"
	"strings"

	"codeberg.org/iklabib/swadidik/storage"
	"codeberg.org/iklabib/swadidik/utils"
	"github.com/labstack/echo/v5"
)

type WorkspaceFile struct {
	FilePath    string `json:"filePath"`
	Content     string `json:"content"`
	ContentType string `json:"contentType"`
}

func FilesHandler(s3 *storage.S3Client) echo.HandlerFunc {
	return func(c *echo.Context) error {
		ctx := c.Request().Context()
		prefix := c.Param("id")
		objects, err := s3.FetchFilesByPrefix(ctx, "swadidik", prefix)
		if err != nil {
			return c.JSON(http.StatusInternalServerError,
				map[string]string{"error": "could not fetch files " + err.Error()})
		}

		files := []WorkspaceFile{}

		for _, obj := range objects {
			res, err := s3.GetObject(ctx, "swadidik", obj.Key)
			if err != nil || res == nil {
				return c.JSON(http.StatusInternalServerError,
					map[string]string{"error": "could not fetch files"})
			}

			content, err := io.ReadAll(res.Body)
			if err != nil {
				return c.JSON(http.StatusInternalServerError,
					map[string]string{"error": "could not fetch files"})
			}

			key := strings.TrimPrefix(obj.Key, prefix+"/")
			if key == "" {
				continue
			}

			workspaceFile := WorkspaceFile{
				FilePath:    key,
				Content:     string(content),
				ContentType: utils.ExtToContentType(key),
			}

			files = append(files, workspaceFile)
		}

		return c.JSON(http.StatusOK,
			map[string][]WorkspaceFile{"files": files})
	}
}
