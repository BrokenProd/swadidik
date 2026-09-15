import type { WorkspaceFile } from "#/shared/files";

interface WorkspaceFiles {
  files: WorkspaceFile[];
  folders: string[];
}

export const loadWorkspaceFiles = async (uuid: string): Promise<WorkspaceFiles> => {
  const req = await fetch(`/api/files/${uuid}`, { method: "GET" })
  const workspaceFiles = await req.json() as WorkspaceFile[]

  return {
    files: workspaceFiles,
    folders: [],
  };
};

export type { WorkspaceFiles };
