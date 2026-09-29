import { useEffect, useState } from "react";
import type { WorkspaceConfig } from "./workspaceUiStore";
import { useFileSystemStore } from "./fileSystemStore";
import { useWorkspaceUiStore } from "./workspaceUiStore";

interface UseWorkspaceInitializationOptions {
  uuid: string
  showTabs?: boolean;
  editable?: boolean;
  updateConfig: (config: Partial<WorkspaceConfig>) => void;
}

export const useWorkspaceInitialization = ({
  uuid,
  showTabs,
  editable,
  updateConfig,
}: UseWorkspaceInitializationOptions) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (showTabs !== undefined) {
      updateConfig({ showTabs });
    }

    if (editable !== undefined) {
      updateConfig({ editable });
    }
  }, [editable, showTabs, updateConfig]);

  useEffect(() => {
    const initialize = async () => {
      setIsInitialized(false);
      setStatus("loading");

      try {
        const { loadWorkspaceFiles } = await import("./files");
        const ws = await loadWorkspaceFiles(uuid);

        useFileSystemStore.getState().hydrate(ws.files);
        useWorkspaceUiStore.getState().initializeTabs(
          ws.files.map((file) => file.filePath),
          ws.files[0]?.filePath ?? "",
        );
        setIsInitialized(true);
        setStatus("success");
      } catch {
        setStatus("error");
      }
    };

    initialize();
  }, [uuid]);

  return { isInitialized, status };
};
