package runners

type Runner interface {
	Prep() error
	Build() error
	Run() (string, error)
	Dispose() error
}

type SourceFile struct {
	FilePath string `json:"filePath"`
	Content  string `json:"content"`
}

type RunDto struct {
	Language string       `json:"language"`
	Files    []SourceFile `json:"files"`
}

type RunResponse struct {
	Id     string `json:"id"`
	Output string `json:"output"`
}
