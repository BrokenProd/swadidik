import { useEffect, useState } from "react";
import type { WorkspaceConfig } from "./workspaceUiStore";
import { useFileSystemStore } from "./fileSystemStore";
import { useWorkspaceUiStore } from "./workspaceUiStore";
import { isMaterialFile } from "#/shared/files";

interface UseWorkspaceInitializationOptions {
  uuid: string;
  track: string | number;
  showTabs?: boolean;
  editable?: boolean;
  updateConfig: (config: Partial<WorkspaceConfig>) => void;
}

export const useWorkspaceInitialization = ({
  uuid,
  track,
  showTabs,
  editable,
  updateConfig,
}: UseWorkspaceInitializationOptions) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [prevTrack, setPrevTrack] = useState(track);

  if (prevTrack !== track) {
    setPrevTrack(track);
    setStatus("loading");
    setIsInitialized(false);
  }

  useEffect(() => {
    if (showTabs !== undefined) {
      updateConfig({ showTabs });
    }

    if (editable !== undefined) {
      updateConfig({ editable });
    }
  }, [editable, showTabs, updateConfig]);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      setIsInitialized(false);
      setStatus("loading");

      try {
        const { loadWorkspaceFiles } = await import("./files");
        const ws = await loadWorkspaceFiles(uuid, track);
        if (cancelled) return;

        const preferredFile =
          ws.files.find(
            ({ filePath }) => filePath.split("/").pop() === "Main.java",
          ) ??
          ws.files.find(
            ({ filePath }) => filePath.split("/").pop() === "main.py",
          );
        const tabPaths = ws.files
          .filter((file) => !isMaterialFile(file.filePath))
          .map((file) => file.filePath);

        if (preferredFile) {
          tabPaths.splice(tabPaths.indexOf(preferredFile.filePath), 1);
          tabPaths.unshift(preferredFile.filePath);
        }

        useFileSystemStore.getState().hydrate(ws.files);
        useWorkspaceUiStore
          .getState()
          .initializeTabs(
            tabPaths,
            preferredFile?.filePath ?? tabPaths[0] ?? "",
          );
        setIsInitialized(true);
        setStatus("success");
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    };

    initialize();

    return () => {
      cancelled = true;
    };
  }, [track, uuid]);

  return { isInitialized, status };
};
