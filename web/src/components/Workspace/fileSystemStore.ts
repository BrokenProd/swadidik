import { enableMapSet } from "immer";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { WorkspaceFile } from "#/shared/files";
import { clearEditors, removeEditor, renameEditor } from "./editorRegistry";
import { useWorkspaceUiStore } from "./workspaceUiStore";

enableMapSet();
export type WorkspaceFiles = Record<string, WorkspaceFile>;
const isSameOrDescendant = (candidate: string, path: string) => candidate === path || candidate.startsWith(`${path}/`);

interface FileSystemState {
  files: WorkspaceFiles;
  folders: Set<string>;
  hydrate: (files: WorkspaceFile[], folders?: string[]) => void;
  createFile: (file: WorkspaceFile) => boolean;
  updateFileContent: (path: string, content: string) => void;
  addFolder: (path: string) => boolean;
  renameEntry: (oldPath: string, newPath: string, isFolder: boolean) => boolean;
  deleteEntry: (path: string, isFolder: boolean) => boolean;
}

export const useFileSystemStore = create<FileSystemState>()(immer((set, get) => ({
  files: {}, folders: new Set(),
  hydrate: (files, folders = []) => {
    clearEditors();
    set((state) => { state.files = Object.fromEntries(files.map((file) => [file.filePath, file])); state.folders = new Set(folders); });
  },
  createFile: (file) => {
    if (get().files[file.filePath]) return false;
    set((state) => { state.files[file.filePath] = file; });
    return true;
  },
  updateFileContent: (path, content) => set((state) => { if (state.files[path]) state.files[path].content = content; }),
  addFolder: (path) => {
    if (get().folders.has(path)) return false;
    set((state) => { state.folders.add(path); });
    return true;
  },
  renameEntry: (oldPath, newPath, isFolder) => {
    const { files, folders } = get();
    const affectedFiles = Object.keys(files).filter((path) => isFolder ? isSameOrDescendant(path, oldPath) : path === oldPath);
    if ((!isFolder && !files[oldPath]) || (isFolder && !folders.has(oldPath) && affectedFiles.length === 0)) return false;
    const pathChanges = new Map(affectedFiles.map((path) => [path, isFolder ? `${newPath}${path.slice(oldPath.length)}` : newPath]));
    if ([...pathChanges.values()].some((path) => files[path] && !pathChanges.has(path))) return false;
    set((state) => {
      pathChanges.forEach((replacement, path) => { const file = state.files[path]; delete state.files[path]; state.files[replacement] = { ...file, filePath: replacement }; });
      if (isFolder) {
        [...state.folders].forEach((folder) => { if (isSameOrDescendant(folder, oldPath)) { state.folders.delete(folder); state.folders.add(`${newPath}${folder.slice(oldPath.length)}`); } });
      }
    });
    pathChanges.forEach((replacement, path) => renameEditor(path, replacement));
    useWorkspaceUiStore.getState().renameTabs(pathChanges);
    return true;
  },
  deleteEntry: (path, isFolder) => {
    const paths = new Set(Object.keys(get().files).filter((candidate) => isFolder ? isSameOrDescendant(candidate, path) : candidate === path));
    if (!isFolder && !paths.size) return false;
    set((state) => {
      paths.forEach((filePath) => { delete state.files[filePath]; });
      if (isFolder) [...state.folders].forEach((folder) => { if (isSameOrDescendant(folder, path)) state.folders.delete(folder); });
    });
    paths.forEach(removeEditor);
    useWorkspaceUiStore.getState().removeTabs(paths);
    return true;
  },
})));
