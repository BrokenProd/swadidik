import type { ComponentType } from "react";
import type { WorkspaceFile } from "#/shared/files";

export type MobilePane =
  | "editor"
  | "files"
  | "material";

export type EditorComponentType = ComponentType<{ file: WorkspaceFile }>;
export type FileTreeComponentType = ComponentType<Record<string, never>>;
export type TerminalPanelComponentType = ComponentType<{
  onMaximize?: () => void;
}>;
