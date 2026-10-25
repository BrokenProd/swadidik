import { useEffect, useState } from "react";
import type { WorkspaceConfig } from "./workspaceUiStore";
import { useFileSystemStore } from "./fileSystemStore";
import { useWorkspaceUiStore } from "./workspaceUiStore";
import { isMaterialFile } from "#/shared/files";
import { loadWorkspaceFiles } from "./files";

interface UseWorkspaceInitializationOptions {
  courseId: string;
  uuid: string;
  editable?: boolean;
  updateConfig: (config: Partial<WorkspaceConfig>) => void;
}

export const useWorkspaceInitialization = ({
  courseId,
  uuid,
  editable,
  updateConfig,
}: UseWorkspaceInitializationOptions) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [prevTrack, setPrevTrack] = useState(uuid);

  if (prevTrack !== uuid) {
    setPrevTrack(uuid);
    setStatus("loading");
    setIsInitialized(false);
  }

  useEffect(() => {
    if (editable !== undefined) {
      updateConfig({ editable });
    }
  }, [editable, updateConfig]);

  useEffect(() => {
    let cancelled = false;
    const initialize = async () => {
      setIsInitialized(false);
      setStatus("loading");

      try {
        const ws = await loadWorkspaceFiles(courseId, uuid);

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

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [courseId, uuid]);

  return {
    isInitialized,
    status,
  };
};
