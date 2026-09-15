import type { WorkspaceFile } from "#/shared/files";
import { Compartment } from "@codemirror/state";
import { EditorView } from "codemirror";

interface WorkspaceFiles {
  files: WorkspaceFile[];
  folders: string[];
}

export const loadWorkspaceFiles = async (uuid: string): Promise<WorkspaceFiles> => {
  const req = await fetch(`/api/files/${uuid}`, { method: "GET" })
  const workspaceFiles = await req.json() as WorkspaceFile[]

  const files = workspaceFiles.map((file) => ({
    filePath: file.filePath,
    content: file.content,
    contentType: file.contentType,
    view: new EditorView(),
    themeCompartment: new Compartment(),
  })) as WorkspaceFile[];

  return {
    files,
    folders: [],
  };
};

export type { WorkspaceFiles };
