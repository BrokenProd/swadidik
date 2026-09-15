import { create } from "zustand";
import type { WorkspaceFile } from "#/shared/files";
import { EditorAppearance } from "#/shared/editorSettings";

export type WorkspaceConfig = {
  showFileTree: boolean;
  showTabs: boolean;
  editable: boolean;
};

interface WorkspaceState {
  files: WorkspaceFile[];
  tabs: WorkspaceFile[];
  selectedTab: string;
  closedTabs: Set<string>;
  appearance: ReturnType<typeof EditorAppearance.load>;
  folders: Set<string>;
  config: WorkspaceConfig;
  isRunning: boolean;
  isSubmiting: boolean;

  fileIndex: Map<string, number>;
  expandedFolders: Set<string>;

  setFiles: (
    files: WorkspaceFile[] | ((prev: WorkspaceFile[]) => WorkspaceFile[]),
  ) => void;
  setTabs: (
    tabs: WorkspaceFile[] | ((prev: WorkspaceFile[]) => WorkspaceFile[]),
  ) => void;
  setSelectedTab: (tab: string) => void;
  setClosedTabs: (
    tabs: Set<string> | ((prev: Set<string>) => Set<string>),
  ) => void;
  removeTab: (path: string) => void;

  /** Updates a file in memory. */
  updateFile: (file: WorkspaceFile) => boolean;
  /** Removes a file from memory. */
  deleteFile: (path: string) => Promise<boolean>;
  /** Adds a new file in memory. */
  createFile: (file: WorkspaceFile) => void;
  /** Renames a file in memory. */
  renameFile: (oldPath: string, newPath: string) => void;
  getFile: (path: string) => WorkspaceFile | null;

  /** Adds a folder in memory. */
  addFolder: (path: string) => void;
  /** Removes a folder recursively from memory. */
  deleteFolder: (path: string) => void;
  /** Renames a folder and its nested folders in memory. */
  renameFolder: (oldPath: string, newPath: string) => void;

  updateAppearance: (
    settings: Partial<ReturnType<typeof EditorAppearance.load>>,
  ) => void;

  updateConfig: (config: Partial<WorkspaceConfig>) => void;

  setRunning: (state: boolean) => void;
  setSubmiting: (state: boolean) => void;
  toggleFolderExpanded: (path: string) => void;
  setExpandedFolders: (folders: Set<string>) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  files: [],
  tabs: [],
  selectedTab: "",
  closedTabs: new Set(),
  appearance: EditorAppearance.load(),
  fileIndex: new Map(),
  expandedFolders: new Set(),
  folders: new Set(),
  config: {
    showFileTree: true,
    showTabs: true,
    editable: true,
  },
  isRunning: false,
  isSubmiting: false,
  setFiles: (files) => {
    set((state) => ({
      files: typeof files === "function" ? files(state.files) : files,
    }));
  },

  setTabs: (tabs) => {
    set((state) => ({
      tabs: typeof tabs === "function" ? tabs(state.tabs) : tabs,
    }));
  },

  setSelectedTab: (tab) => {
    set({ selectedTab: tab });
  },

  setClosedTabs: (tabs) => {
    set((state) => ({
      closedTabs: typeof tabs === "function" ? tabs(state.closedTabs) : tabs,
    }));
  },

  updateFile: (file) => {
    const { files, fileIndex, setFiles } = get();

    const idx = fileIndex.get(file.filePath) ?? -1;
    if (idx < 0) {
      return false;
    }

    setFiles([...files.slice(0, idx), file, ...files.slice(idx + 1)]);

    return true;
  },

  deleteFile: async (path): Promise<boolean> => {
    const { files, fileIndex } = get();

    const idx = fileIndex.get(path) ?? -1;
    if (idx < 0) return false;

    const newFiles = [...files.slice(0, idx), ...files.slice(idx + 1)];
    const newFileIndex = new Map(newFiles.map((f, i) => [f.filePath, i]));

    set({
      files: newFiles,
      fileIndex: newFileIndex,
    });

    return true;
  },

  renameFile: (oldPath, newPath) => {
    const { files, tabs, selectedTab, fileIndex } = get();

    const idx = fileIndex.get(oldPath) ?? -1;
    if (idx < 0) return;

    const updatedFile = { ...files[idx], filePath: newPath };

    const updatedFiles = [
      ...files.slice(0, idx),
      updatedFile,
      ...files.slice(idx + 1),
    ];

    const updatedTabs = tabs.map((tab) => {
      if (tab.filePath === oldPath) {
        return updatedFile;
      }
      return tab;
    });

    const newSelectedTab = selectedTab === oldPath ? newPath : selectedTab;
    const newFileIndex = new Map(updatedFiles.map((f, i) => [f.filePath, i]));

    set({
      files: updatedFiles,
      tabs: updatedTabs,
      selectedTab: newSelectedTab,
      fileIndex: newFileIndex,
    });

  },

  createFile: (file) => {
    const { files, setFiles } = get();

    const newFiles = [...files, file];
    const newFileIndex = new Map(newFiles.map((f, i) => [f.filePath, i]));

    setFiles(newFiles);
    set({ fileIndex: newFileIndex });

  },

  getFile: (path) => {
    const { files, fileIndex } = get();
    const idx = fileIndex.get(path) ?? -1;
    if (idx < 0) {
      return null;
    }

    return files[idx];
  },

  removeTab: (path) => {
    const { tabs, selectedTab } = get();

    const indexToRemove = tabs.findIndex((t) => t.filePath === path);
    if (indexToRemove === -1) return;

    const newTabs = tabs.filter((t) => t.filePath !== path);

    let newSelectedTab;
    if (selectedTab !== path) {
      newSelectedTab = selectedTab;
    } else if (newTabs.length === 0) {
      newSelectedTab = "";
    } else {
      const idx = Math.max(0, indexToRemove - 1);
      newSelectedTab = newTabs[idx].filePath;
    }

    set({
      tabs: newTabs,
      selectedTab: newSelectedTab,
    });
  },

  updateAppearance: (settings) => {
    const current = EditorAppearance.load();
    const updated = EditorAppearance.save({
      ...current,
      ...settings,
    });

    set({ appearance: updated });
  },

  addFolder: (path) => {
    const { folders } = get();
    const newFolders = new Set(folders).add(path);
    set({ folders: newFolders });

  },

  deleteFolder: (path) => {
    const { folders } = get();
    const newFolders = new Set(folders);
    newFolders.delete(path);
    Array.from(folders).forEach((folder) => {
      if (folder.startsWith(path + "/")) {
        newFolders.delete(folder);
      }
    });
    set({ folders: newFolders });

  },

  renameFolder: (oldPath, newPath) => {
    const { folders } = get();
    const newFolders = new Set<string>();

    folders.forEach((folder) => {
      if (folder === oldPath) {
        newFolders.add(newPath);
      } else if (folder.startsWith(oldPath + "/")) {
        const relativePath = folder.substring(oldPath.length);
        newFolders.add(newPath + relativePath);
      } else {
        newFolders.add(folder);
      }
    });

    set({ folders: newFolders });

  },

  updateConfig: (config) => {
    set((state) => ({
      config: { ...state.config, ...config },
    }));
  },
  setSubmiting: (state: boolean) => {
    set({ isSubmiting: state });
  },

  setRunning: (state: boolean) => {
    set({ isRunning: state });
  },
  toggleFolderExpanded: (path: string) => {
    set((state) => {
      const newExpanded = new Set(state.expandedFolders);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return { expandedFolders: newExpanded };
    });
  },
  setExpandedFolders: (folders: Set<string>) => {
    set({ expandedFolders: folders });
  },
}));

/**
 * Hydrates the in-memory store with the workspace files loaded at startup.
 */
export const initializeWorkspace = (
  files: WorkspaceFile[],
  defaultTab: string,
  folders: string[] = [],
) => {
  const normalizedDefaultTab =
    files.some((file) => file.filePath === defaultTab)
      ? defaultTab
      : files.find((file) => {
        const fileName = file.filePath.split("/").pop();
        return file.filePath === `/${defaultTab}` || fileName === defaultTab;
      })?.filePath ?? defaultTab;

  useWorkspaceStore.setState({
    files,
    tabs: [...files],
    selectedTab: normalizedDefaultTab,
    fileIndex: new Map(files.map((f, i) => [f.filePath, i])),
    folders: new Set(folders),
  });
};
