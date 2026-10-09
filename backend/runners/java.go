package runners

import (
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

type Java struct {
	Workdir string
	Files   []SourceFile
}

func NewJava(files []SourceFile) Runner {
	java := &Java{Files: files}
	return java
}

func (java *Java) Prep() error {
	tempDir, err := os.MkdirTemp("", "swadidik_*")
	if err != nil {
		return errors.New("failed to create temp dir")
	}

	if err := os.Chmod(tempDir, 0755); err != nil {
		return err
	}

	java.Workdir = tempDir

	for _, file := range java.Files {
		filePath := filepath.Join(java.Workdir, file.FilePath)

		if err := os.MkdirAll(filepath.Dir(filePath), 0755); err != nil {
			return err
		}

		if err := os.WriteFile(filePath, []byte(file.Content), 0444); err != nil {
			return err
		}
	}

	return nil
}

func (java *Java) Build() error {
	fileNames := []string{}
	for _, file := range java.Files {
		fileNames = append(fileNames, file.FilePath)
	}

	cmd := exec.Command("/opt/jdk/bin/javac", fileNames...)
	cmd.Dir = java.Workdir

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("javac failed: %v\n%s", err, output)
	}

	fmt.Print(string(output))

	commandArgs := []string{
		"-c",
		"-f", "main.jar",
		"-e", "Main",
	}

	commandArgs = append(commandArgs, fileNames...)
	cmd = exec.Command("/opt/jdk/bin/jar", commandArgs...)
	cmd.Dir = java.Workdir

	output, err = cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("jar failed: %v\n%s", err, output)
	}

	return nil
}

func (java *Java) Run() (string, error) {
	cmd := exec.Command(
		"/bin/nsjail",
		"-Q",
		"--forward_signals",
		"--config",
		"/app/profiles/sandbox.cfg",
		"-R",
		java.Workdir,
		"--cwd",
		java.Workdir,
		"--",
		"/opt/jdk/bin/java",
		"-jar", "main.jar",
	)

	cmd.Dir = java.Workdir

	output, err := cmd.CombinedOutput()
	if err != nil {
		return string(output), err
	}

	return string(output), nil
}
