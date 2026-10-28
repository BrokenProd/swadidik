import { lazy, Suspense, useCallback, useRef, useState } from "react";
import type { JSX } from "react";
import { isMaterialFile, type WorkspaceFile } from "#/shared/files";
import { Group, Panel, Separator } from "react-resizable-panels";
import type { GroupImperativeHandle, Layout } from "react-resizable-panels";
import {
  ChevronLeft,
  ChevronRight,
  CircleX,
  MoveLeft,
  BookOpenText,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import MarkdownPanel from "#/components/MarkdownPanel";
import LoadingHolder from "./LoadingHolder";
import { useFileSystemStore } from "./fileSystemStore";
import { useWorkspaceUiStore } from "./workspaceUiStore";
import { useDesktopLayout } from "./useDesktopLayout";
import { useWorkspaceInitialization } from "./useWorkspaceInitialization";
import { useActiveWorkspaceTab } from "./useActiveWorkspaceTab";
import { loadWorkspaceFiles } from "./files";
import type { MobilePane } from "./useActiveWorkspaceTab";
import EditorSettings from "./EditorSettings";
import { useTerminalStore } from "#/components/Terminal/terminalStore";
import TracksDrawer from "./TracksDrawer";
import type { Track } from "#/shared/course";
import { useCourseProgress } from "#/shared/useCourseProgress";
import { apiFetch } from "#/shared/api";

interface Props {
  courseId: string;
  uuid: string;
  showFileTree?: boolean;
  showTabs?: boolean;
  editable?: boolean;
}

type WorkspaceLocationState = {
  tracks?: Track[];
} | null;

const EditorPane = lazy(() => import("./EditorPane"))
const Editor = lazy(() => import("#/components/Editor"));
const FileTree = lazy(() => import("./FileTree"));
const TerminalPanel = lazy(() => import("./TerminalPanel"));

const MIN_TERMINAL_HEIGHT = 160;
const MIN_EDITOR_HEIGHT = 220;
const EXPANDED_TERMINAL_LAYOUT: Layout = {
  "workspace-editor": 25,
  "workspace-terminal": 75,
};
const PANEL_IDS = {
  editor: "workspace-editor",
  terminal: "workspace-terminal",
} as const;

const waitForLoadingScreen = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

const Workspace = ({
  courseId,
  uuid,
  showFileTree,
  showTabs,
  editable,
}: Props) => {
  const navigate = useNavigate();
  const [editorReady, setEditorReady] = useState(false);
  const [markdownReady, setMarkdownReady] = useState(false);
  const handleEditorReady = useCallback(() => setEditorReady(true), []);
  const handleMarkdownReady = useCallback(() => setMarkdownReady(true), []);

  const [maximizeTerminal, setMaximizeTerminal] = useState(false);
  const [isLoadingNextTrack, setIsLoadingNextTrack] = useState(false);
  const [isTracksMenuOpen, setIsTracksMenuOpen] = useState(false);
  const [isFileTreeCollapsed, setIsFileTreeCollapsed] = useState(false);
  const [mobilePane, setMobilePane] = useState<MobilePane>("editor");
  const [terminalLayout, setTerminalLayout] = useState<Layout>({
    [PANEL_IDS.editor]: 70,
    [PANEL_IDS.terminal]: 30,
  });
  const groupRef = useRef<GroupImperativeHandle>(null);
  const layoutBeforeTerminalExpansion = useRef<Layout>(terminalLayout);
  const isDesktopLayout = useDesktopLayout();

  const location = useLocation();
  const tracks = (location.state as WorkspaceLocationState)?.tracks ?? [];
  const { completedTrackIDs, setCompletedTrackIDs } =
    useCourseProgress(courseId);

  const tabPaths = useWorkspaceUiStore((state) => state.tabs);
  const files = useFileSystemStore((state) => state.files);
  const tabs = tabPaths
    .map((path) => files[path])
    .filter((file): file is WorkspaceFile =>
      Boolean(file && !isMaterialFile(file.filePath)),
    );
  const materialFile = Object.values(files).find((file) =>
    isMaterialFile(file.filePath),
  );
  const selectedTab = useWorkspaceUiStore((state) => state.selectedTab);
  const updateConfig = useWorkspaceUiStore((state) => state.updateConfig);
  const clearTerminal = useTerminalStore((state) => state.clear);

  const showTree = showFileTree === undefined || showFileTree;

  const { isInitialized, status } = useWorkspaceInitialization({
    courseId,
    uuid,
    editable,
    updateConfig,
  });

  const activeTab = useActiveWorkspaceTab({
    tabs,
    selectedTab,
    isInitialized,
    isDesktopLayout,
    mobilePane,
  });
  if (status === "loading" || isLoadingNextTrack) return <LoadingHolder />;
  else if (status === "error") {
    return (
      <div className="size-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="text-error">
            <CircleX />
          </span>
          <p className="text-xl font-semibold">Galat Memuat!</p>
        </div>
      </div>
    );
  }

  const renderLoadingPane = (): JSX.Element => (
    <div className="flex h-full items-center justify-center bg-base-100">
      <span className="loading loading-spinner loading-md" />
    </div>
  );

  const mobilePanes = [
    { id: "editor" as const, label: "Editor", visible: true },
    { id: "files" as const, label: "Files", visible: showTree },
    {
      id: "material" as const,
      label: "Material",
      visible: Boolean(materialFile),
    },
  ].filter((pane) => pane.visible);

  const editorVisible =
    tabs.length > 0 && (isDesktopLayout || mobilePane === "editor");
  const materialVisible =
    Boolean(materialFile) && (isDesktopLayout || mobilePane === "material");
  const allReady =
    (!editorVisible || editorReady) && (!materialVisible || markdownReady);

  const editorPane = (
    <Suspense fallback={renderLoadingPane()}>
      <EditorPane
        tabs={tabs}
        activeTab={activeTab}
        showTabs={showTabs}
        EditorComponent={Editor}
        onEditorReady={handleEditorReady}
        fileTreeToggle={
          isDesktopLayout && showTree
            ? {
              collapsed: isFileTreeCollapsed,
              onToggle: () => setIsFileTreeCollapsed((c) => !c),
            }
            : undefined
        }
      />
    </Suspense>
  );

  const handleTerminalLayoutChanged = (layout: Layout) => {
    const editorSize = layout[PANEL_IDS.editor];
    const terminalSize = layout[PANEL_IDS.terminal];

    if (typeof editorSize === "number" && typeof terminalSize === "number") {
      setTerminalLayout({
        [PANEL_IDS.editor]: Number(editorSize.toFixed(1)),
        [PANEL_IDS.terminal]: Number(terminalSize.toFixed(1)),
      });
    }
  };

  const toggleTerminalExpansion = () => {
    if (maximizeTerminal) {
      groupRef.current?.setLayout(layoutBeforeTerminalExpansion.current);
      setMaximizeTerminal(false);
      return;
    }

    layoutBeforeTerminalExpansion.current =
      groupRef.current?.getLayout() ?? terminalLayout;
    groupRef.current?.setLayout(EXPANDED_TERMINAL_LAYOUT);
    setMaximizeTerminal(true);
  };

  const changeTrack = (nextTrackUuid: string) => {
    setEditorReady(false);
    setMarkdownReady(false);
    clearTerminal();
    navigate(
      `${location.pathname}?course_id=${encodeURIComponent(courseId)}&uuid=${encodeURIComponent(nextTrackUuid)}`,
      { state: { tracks } },
    );
  };

  const selectTrack = (selectedTrackUuid: string) => {
    if (selectedTrackUuid === uuid) {
      setIsTracksMenuOpen(false);
      return;
    }

    setIsTracksMenuOpen(false);
    changeTrack(selectedTrackUuid);
  };

  const toggleTrackCompletion = async (
    trackId: string,
    isComplete: boolean,
  ) => {
    setCompletedTrackIDs((trackIDs) => {
      const nextTrackIDs = new Set(trackIDs);
      if (isComplete) nextTrackIDs.add(trackId);
      else nextTrackIDs.delete(trackId);
      return nextTrackIDs;
    });

    try {
      const response = await apiFetch("/courses/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track_id: trackId, is_done: isComplete }),
      });
      if (response.ok) return;
    } catch {
      // Revert the optimistic update below.
    }

    setCompletedTrackIDs((trackIDs) => {
      const nextTrackIDs = new Set(trackIDs);
      if (isComplete) nextTrackIDs.delete(trackId);
      else nextTrackIDs.add(trackId);
      return nextTrackIDs;
    });
  };

  const changeToNextTrack = async () => {
    const currentTrackIndex = tracks.findIndex((item) => item.uuid === uuid);
    const nextTrack = tracks[currentTrackIndex + 1];
    if (!nextTrack) return;

    setIsLoadingNextTrack(true);
    try {
      await waitForLoadingScreen();

      const headers = new Headers();
      headers.set("Content-Type", "application/json");
      const response = await apiFetch("/courses/progress", {
        method: "POST",
        headers,
        body: JSON.stringify({ track_id: uuid, is_done: true }),
      });
      if (!response.ok) return;

      setCompletedTrackIDs((trackIDs) => new Set(trackIDs).add(uuid));

      const nextWorkspace = await loadWorkspaceFiles(courseId, nextTrack.uuid);
      if (nextWorkspace.files.length > 0) changeTrack(nextTrack.uuid);
    } catch {
      // Keep the current workspace open if the next track cannot be loaded.
    } finally {
      setIsLoadingNextTrack(false);
    }
  };

  const currentTrackIndex = tracks.findIndex((item) => item.uuid === uuid);
  const previousTrack = tracks[currentTrackIndex - 1];
  const nextTrack = tracks[currentTrackIndex + 1];

  const desktopMainColumn = (
    <Group
      orientation="vertical"
      className="h-full min-h-0"
      defaultLayout={terminalLayout}
      onLayoutChanged={handleTerminalLayoutChanged}
      groupRef={groupRef}
      id="workspace-main-group"
    >
      <Panel id={PANEL_IDS.editor} minSize={MIN_EDITOR_HEIGHT}>
        <div className="size-full min-h-0">{editorPane}</div>
      </Panel>

      <Separator
        className="shrink-0 bg-base-300 transition-colors hover:bg-base-content/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        id="workspace-terminal-separator"
      />

      <Panel
        id={PANEL_IDS.terminal}
        minSize={MIN_TERMINAL_HEIGHT}
        maxSize="75%"
      >
        <div className="size-full min-h-0">
          <Suspense fallback={renderLoadingPane()}>
            <TerminalPanel onMaximize={toggleTerminalExpansion} />
          </Suspense>
        </div>
      </Panel>
    </Group>
  );

  const mobileEditorPane = (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="min-h-0 flex-1">{editorPane}</div>
      <div className="h-[38%] min-h-48 overflow-hidden">
        <Suspense fallback={renderLoadingPane()}>
          <TerminalPanel />
        </Suspense>
      </div>
    </div>
  );

  return (
    <div className="relative flex h-full flex-col bg-base-200/50 p-2">
      <header className="relative flex h-11 shrink-0 items-center justify-between border border-base-300 bg-base-100 px-2">
        <nav className="flex items-center gap-1" aria-label="Track navigation">
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            aria-label="Kembali ke daftar materi"
            title="Kembali"
            onClick={() => {
              navigate(`/tracks?course_id=${encodeURIComponent(courseId)}`);
            }}
          >
            <MoveLeft />
            <span className="hidden sm:inline">Kembali</span>
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => previousTrack && changeTrack(previousTrack.uuid)}
            aria-label="Previous track"
            title="Previous"
            disabled={!previousTrack}
          >
            <ChevronLeft className="size-5" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => void changeToNextTrack()}
            aria-label="Next track"
            title="Next"
            disabled={isLoadingNextTrack || !nextTrack}
          >
            <span className="hidden sm:inline">Selanjutnya</span>
            <ChevronRight />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            aria-label="Daftar materi"
            aria-expanded={isTracksMenuOpen}
            aria-controls="workspace-tracks-drawer"
            onClick={() => setIsTracksMenuOpen((open) => !open)}
          >
            <BookOpenText className="size-4" />
            <span className="hidden sm:inline">Daftar Materi</span>
          </button>
          <EditorSettings />
        </nav>
      </header>

      <TracksDrawer
        tracks={tracks}
        activeTrackUuid={uuid}
        completedTrackIDs={completedTrackIDs}
        isOpen={isTracksMenuOpen}
        onClose={() => setIsTracksMenuOpen(false)}
        onSelect={selectTrack}
        onToggleCompletion={(trackId, isComplete) =>
          void toggleTrackCompletion(trackId, isComplete)
        }
      />

      {!isDesktopLayout && (
        <>
          <div className="mt-2 flex flex-wrap gap-2">
            {mobilePanes.map((pane) => (
              <button
                key={pane.id}
                className={`btn btn-sm ${mobilePane === pane.id ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setMobilePane(pane.id)}
              >
                {pane.label}
              </button>
            ))}
          </div>

          <div className="mt-2 min-h-0 flex-1 overflow-hidden">
            {mobilePane === "editor" && mobileEditorPane}
            {mobilePane === "files" && showTree && (
              <div className="h-full overflow-hidden">
                <Suspense fallback={renderLoadingPane()}>
                  <FileTree />
                </Suspense>
              </div>
            )}
            {mobilePane === "material" && (
              <div className="flex h-full flex-col overflow-hidden bg-base-100">
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <MarkdownPanel
                    markdown={materialFile?.content ?? ""}
                    onReady={handleMarkdownReady}
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {isDesktopLayout && (
        <div className="min-h-0 flex-1">
          <div className="flex h-full min-w-0">
            {showTree && !isFileTreeCollapsed && (
              <aside className="flex w-72 min-w-60 flex-col border-r border-base-300">
                <div className="flex items-center justify-between border-b border-base-300 px-3 py-2">
                  <span className="text-sm font-medium">Berkas</span>
                </div>
                <div className="min-h-0 flex-1 overflow-hidden">
                  <Suspense fallback={renderLoadingPane()}>
                    <FileTree />
                  </Suspense>
                </div>
              </aside>
            )}

            {materialFile ? (
              <Group
                orientation="horizontal"
                className="min-h-0 min-w-0 flex-1"
                id="workspace-content-group"
              >
                <Panel
                  id="workspace-main-panel"
                  minSize="320px"
                  defaultSize="55%"
                >
                  <div className="size-full min-h-0 min-w-0">
                    {desktopMainColumn}
                  </div>
                </Panel>

                <Separator
                  className="w-1 shrink-0 cursor-col-resize bg-base-300 transition-colors hover:bg-base-content/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  id="workspace-material-separator"
                />

                <Panel
                  id="workspace-material-panel"
                  minSize="280px"
                  defaultSize="45%"
                >
                  <aside className="flex size-full min-h-0 flex-col bg-base-100">
                    <div className="min-h-0 flex-1 overflow-y-auto">
                      <MarkdownPanel
                        markdown={materialFile.content}
                        onReady={handleMarkdownReady}
                      />
                    </div>
                  </aside>
                </Panel>
              </Group>
            ) : (
              <div className="min-h-0 min-w-0 flex-1">{desktopMainColumn}</div>
            )}
          </div>
        </div>
      )}

      {!allReady && (
        <div className="absolute inset-0 z-20 bg-base-100">
          <LoadingHolder />
        </div>
      )}
    </div>
  );
};

export default Workspace;
