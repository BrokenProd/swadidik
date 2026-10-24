import type { WorkspaceFile } from "#/shared/files";
import { apiFetch } from "#/shared/api";

interface WorkspaceFiles {
  files: WorkspaceFile[];
}

const workspaceFilesCache = new Map<string, Promise<WorkspaceFiles>>();

const getWorkspaceCacheKey = (id: string, track: number | string) =>
  `${id}:${track}`;

export const loadWorkspaceFiles = async (
  course_id: string,
  uuid: string
): Promise<WorkspaceFiles> => {
  const cacheKey = getWorkspaceCacheKey(course_id, uuid);
  const cachedWorkspace = workspaceFilesCache.get(cacheKey);
  if (cachedWorkspace) return cachedWorkspace;

  const workspacePromise = (async (): Promise<WorkspaceFiles> => {
    const req = await apiFetch(`/files/?course_id=${course_id}&uuid=${uuid}`, {
      method: "GET",
    });

    if (!req.ok) {
      throw new Error(`Unable to load workspace files (${req.status})`);
    }

    const workspace = (await req.json()) as WorkspaceFiles;

    return {
      files: workspace.files,
    };
  })();

  workspaceFilesCache.set(cacheKey, workspacePromise);
  try {
    return await workspacePromise;
  } catch (error) {
    workspaceFilesCache.delete(cacheKey);
    throw error;
  }
};

export type { WorkspaceFiles };
