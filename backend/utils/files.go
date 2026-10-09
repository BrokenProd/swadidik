package utils

import (
	"errors"
	"os"
	"path/filepath"
	"strings"
)

func ExtToContentType(filePath string) string {
	ext := strings.TrimPrefix(filepath.Ext(filePath), ".")

	switch ext {
	case "py":
		return "python"
	case "js":
		return "javascript"
	case "ts":
		return "typescript"
	case "go":
		return "go"
	case "md":
		return "markdown"
	case "json":
		return "json"
	case "java":
		return "java"
	default:
		return "plaintext"
	}
}

func CreateTempWorkdir() (string, error) {
	tempDir, err := os.MkdirTemp("", "swadidik_*")
	if err != nil {
		return tempDir, errors.New("failed to create temp dir")
	}

	// if err := os.Chown(tempDir, 1000, 1000); err != nil {
	// 	return tempDir, errors.New("failed to set directory permission")
	// }

	return tempDir, nil
}

func FileExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && !info.IsDir()
}

func DirExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && info.IsDir()
}
