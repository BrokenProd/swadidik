import type { WorkspaceFile } from "#/shared/files";
import { apiFetch } from "#/shared/api";

interface WorkspaceFiles {
  files: WorkspaceFile[];
}

export const loadWorkspaceFiles = async (
  id: string,
): Promise<WorkspaceFiles> => {
  const req = await apiFetch(`/files/${id}`, {
    method: "GET",
  });

  if (!req.ok) {
    throw new Error(`Unable to load workspace files (${req.status})`);
  }

  const workspace = (await req.json()) as WorkspaceFiles;

  return {
    files: workspace.files,
  };
};

export type { WorkspaceFiles };
