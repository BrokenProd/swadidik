package runners

import (
	"errors"
	"os"
	"os/exec"
	"path/filepath"
)

type Python struct {
	Workdir string
	Files   []SourceFile
}

func NewPython(files []SourceFile) Runner {
	return &Python{Files: files}
}

func (python *Python) Prep() error {
	tempDir, err := os.MkdirTemp("", "swadidik_*")
	if err != nil {
		return errors.New("failed to create temp dir")
	}

	if err := os.Chmod(tempDir, 0755); err != nil {
		return err
	}

	python.Workdir = tempDir

	for _, file := range python.Files {
		filePath := filepath.Join(python.Workdir, file.FilePath)

		if err := os.MkdirAll(filepath.Dir(filePath), 0755); err != nil {
			return err
		}

		if err := os.WriteFile(filePath, []byte(file.Content), 0444); err != nil {
			return err
		}
	}

	return nil
}

func (python *Python) Build() error {
	return nil
}

func (python *Python) Run() (string, error) {
	cmd := exec.Command(
		"/bin/nsjail",
		"-Q",
		"--forward_signals",
		"--config",
		"/app/profiles/sandbox.cfg",
		"-R",
		python.Workdir,
		"--cwd",
		python.Workdir,
		"--",
		"/usr/bin/python3", "main.py") // TODO configure which script to run

	cmd.Dir = python.Workdir
	output, err := cmd.CombinedOutput()

	return string(output), err
}

func (python *Python) Dispose() error {
	return os.RemoveAll(python.Workdir)
}
