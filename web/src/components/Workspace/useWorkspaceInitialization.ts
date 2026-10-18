import { useEffect, useState } from "react";
import type { WorkspaceConfig } from "./workspaceUiStore";
import { useFileSystemStore } from "./fileSystemStore";
import { useWorkspaceUiStore } from "./workspaceUiStore";
import { isMaterialFile } from "#/shared/files";
import { loadWorkspaceFiles } from "./files";

interface UseWorkspaceInitializationOptions {
  uuid: string;
  track: string | number;
  showTabs?: boolean;
  editable?: boolean;
  updateConfig: (config: Partial<WorkspaceConfig>) => void;
}

type NextTrackStatus = "loading" | "available" | "unavailable";

interface NextTrackState {
  trackKey: string;
  status: NextTrackStatus;
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
  const [nextTrackState, setNextTrackState] = useState<NextTrackState>({
    trackKey: String(track),
    status: "loading",
  });

  if (prevTrack !== track) {
    setPrevTrack(track);
    setStatus("loading");
    setIsInitialized(false);
    setNextTrackState({
      trackKey: String(track),
      status: "loading",
    });
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
    const trackKey = String(track);
    const trackNumber = Number(track);
    const hasValidTrackNumber =
      Number.isInteger(trackNumber) && trackNumber >= 1;

    const initialize = async () => {
      setIsInitialized(false);
      setStatus("loading");
      setNextTrackState({
        trackKey,
        status: "loading",
      });

      try {
        const preloadPromise = hasValidTrackNumber
          ? loadWorkspaceFiles(uuid, trackNumber + 1)
              .then((workspace) => ({
                status: (workspace.files.length > 0
                  ? "available"
                  : "unavailable") as NextTrackStatus,
              }))
              .catch(() => ({
                status: "unavailable" as NextTrackStatus,
              }))
          : Promise.resolve({
              status: "unavailable" as NextTrackStatus,
            });

        const [ws, nextTrackResult] = await Promise.all([
          loadWorkspaceFiles(uuid, track),
          preloadPromise,
        ]);

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

        setNextTrackState({
          trackKey,
          status: nextTrackResult.status,
        });
        setIsInitialized(true);
        setStatus("success");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setNextTrackState({
            trackKey,
            status: "unavailable",
          });
        }
      }
    };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [track, uuid]);

  const hasValidTrackNumber =
    Number.isInteger(Number(track)) && Number(track) >= 1;

  return {
    isInitialized,
    status,
    nextTrackStatus:
      hasValidTrackNumber && nextTrackState.trackKey === String(track)
        ? nextTrackState.status
        : "unavailable",
  };
};
