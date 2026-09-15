import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { EditorAppearance } from "#/shared/editorSettings";

export type WorkspaceConfig = { showFileTree: boolean; showTabs: boolean; editable: boolean };

interface WorkspaceUiState {
  tabs: string[];
  selectedTab: string;
  expandedFolders: Set<string>;
  appearance: ReturnType<typeof EditorAppearance.load>;
  config: WorkspaceConfig;
  isRunning: boolean;
  isSubmiting: boolean;
  initializeTabs: (paths: string[], selectedPath: string) => void;
  openTab: (path: string) => void;
  setSelectedTab: (path: string) => void;
  removeTab: (path: string) => void;
  removeTabs: (paths: Set<string>) => void;
  renameTabs: (paths: Map<string, string>) => void;
  updateAppearance: (settings: Partial<ReturnType<typeof EditorAppearance.load>>) => void;
  updateConfig: (config: Partial<WorkspaceConfig>) => void;
  setRunning: (value: boolean) => void;
  setSubmiting: (value: boolean) => void;
  toggleFolderExpanded: (path: string) => void;
  setExpandedFolders: (folders: Set<string>) => void;
}

export const useWorkspaceUiStore = create<WorkspaceUiState>()(immer((set) => ({
  tabs: [], selectedTab: "", expandedFolders: new Set(), appearance: EditorAppearance.load(),
  config: { showFileTree: true, showTabs: true, editable: true }, isRunning: false, isSubmiting: false,
  initializeTabs: (paths, selectedPath) => set((state) => { state.tabs = paths; state.selectedTab = selectedPath; }),
  openTab: (path) => set((state) => { if (!state.tabs.includes(path)) state.tabs.push(path); state.selectedTab = path; }),
  setSelectedTab: (path) => set((state) => { state.selectedTab = path; }),
  removeTab: (path) => set((state) => {
    const index = state.tabs.indexOf(path);
    if (index < 0) return;
    state.tabs.splice(index, 1);
    if (state.selectedTab === path) state.selectedTab = state.tabs[Math.max(0, index - 1)] ?? "";
  }),
  removeTabs: (paths) => set((state) => {
    const selectedIndex = state.tabs.indexOf(state.selectedTab);
    state.tabs = state.tabs.filter((path) => !paths.has(path));
    if (paths.has(state.selectedTab)) state.selectedTab = state.tabs[Math.max(0, selectedIndex - 1)] ?? "";
  }),
  renameTabs: (paths) => set((state) => {
    state.tabs = state.tabs.map((path) => paths.get(path) ?? path);
    state.selectedTab = paths.get(state.selectedTab) ?? state.selectedTab;
  }),
  updateAppearance: (settings) => set((state) => {
    state.appearance = EditorAppearance.save({ ...state.appearance, ...settings });
  }),
  updateConfig: (config) => set((state) => { Object.assign(state.config, config); }),
  setRunning: (value) => set((state) => { state.isRunning = value; }),
  setSubmiting: (value) => set((state) => { state.isSubmiting = value; }),
  toggleFolderExpanded: (path) => set((state) => { state.expandedFolders.has(path) ? state.expandedFolders.delete(path) : state.expandedFolders.add(path); }),
  setExpandedFolders: (folders) => set((state) => { state.expandedFolders = folders; }),
})));
