type ContentType =
  | "plaintext"
  | "markdown"
  | "javascript"
  | "typescript"
  | "json"
  | "python"
  | "go"
  | "java";

interface WorkspaceFile {
  filePath: string;
  content: string;
  contentType: ContentType;
}

export const extToContentType = (filePath: string) => {
  const fileName = filePath.split(".").pop() ?? "";

  switch (fileName) {
    case "py":
      return "python";
    case "js":
      return "javascript";
    case "ts":
      return "typescript";
    case "go":
      return "go";
    case "md":
      return "markdown";
    case "json":
      return "json";
    case "java":
      return "java";
    default:
      return "plaintext";
  }
};

export type { ContentType, WorkspaceFile };
