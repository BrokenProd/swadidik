import { useEffect, useState } from "react";
import { initializeWorkspace, type WorkspaceConfig } from "./store";

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
      try {
        const { loadWorkspaceFiles } = await import("./files");
        const ws = await loadWorkspaceFiles(uuid);

        initializeWorkspace(
          ws.files,
          ws.files.length === 0 ? "" : ws.files[0].filePath,
          ws.folders,
        );
        setIsInitialized(true);
        setStatus("success");
      } catch {
        setStatus("error");
      }
    };

    initialize();
  }, []);

  return { isInitialized, status };
};
