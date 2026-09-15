import { useEffect } from "react";
import type { WorkspaceFile } from "#/shared/files";
import type { MobilePane } from "./workspace.types";

interface UseActiveWorkspaceTabOptions {
  tabs: WorkspaceFile[];
  selectedTab: string;
  isInitialized: boolean;
  isDesktopLayout: boolean;
  mobilePane: MobilePane;
}

export const useActiveWorkspaceTab = ({
  tabs,
  selectedTab,
  isInitialized,
  isDesktopLayout,
  mobilePane,
}: UseActiveWorkspaceTabOptions) => {
  const activeTab =
    tabs.find((tab) => tab.filePath === selectedTab)?.filePath ?? tabs[0]?.filePath;

  useEffect(() => {
    const editorVisible = isDesktopLayout || mobilePane === "editor";
    if (!isInitialized || !editorVisible || !activeTab) {
      return;
    }

    const activeFile = tabs.find((tab) => tab.filePath === activeTab);
    if (!activeFile) {
      return;
    }

    const rafId = requestAnimationFrame(() => {
      activeFile.view.requestMeasure();
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [activeTab, isDesktopLayout, isInitialized, mobilePane, tabs]);

  return activeTab;
};
