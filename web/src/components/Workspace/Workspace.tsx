import { useCallback, useRef, useState } from "react";
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
import EditorPane from "./EditorPane";
import { useDesktopLayout } from "./useDesktopLayout";
import { useLazyWorkspaceComponents } from "./useLazyWorkspaceComponents";
import { useWorkspaceInitialization } from "./useWorkspaceInitialization";
import { useActiveWorkspaceTab } from "./useActiveWorkspaceTab";
import { loadWorkspaceFiles } from "./files";
import type { MobilePane } from "./workspace.types";
import EditorSettings from "./EditorSettings";
import { useTerminalStore } from "#/components/Terminal/terminalStore";
import { apiFetch } from "#/shared/api";

interface Props {
  courseId: string;
  uuid: string;
  showFileTree?: boolean;
  showTabs?: boolean;
  editable?: boolean;
}

type Track = {
  uuid: string;
  order: number;
  title: string;
};

type WorkspaceLocationState = {
  tracks?: Track[];
} | null;

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

const Workspace = ({ courseId, uuid, showFileTree, showTabs, editable }: Props) => {
  const navigate = useNavigate();
  const [editorReady, setEditorReady] = useState(false);
  const [markdownReady, setMarkdownReady] = useState(false);
  const handleEditorReady = useCallback(() => setEditorReady(true), []);
  const handleMarkdownReady = useCallback(() => setMarkdownReady(true), []);

  const [prevTrack, setPrevTrack] = useState(uuid);
  if (prevTrack !== uuid) {
    setPrevTrack(uuid);
    setEditorReady(false);
    setMarkdownReady(false);
  }

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

  const tracks = (useLocation().state as WorkspaceLocationState)?.tracks ?? [];

  const tabPaths = useWorkspaceUiStore((state) => state.tabs);
  const files = useFileSystemStore((state) => state.files);
  const tabs = tabPaths
    .map((path) => files[path])
    .filter(
      (file): file is WorkspaceFile => Boolean(file && !isMaterialFile(file.filePath)),
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
    showTabs,
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
  const { EditorComponent, FileTreeComponent, TerminalPanelComponent } =
    useLazyWorkspaceComponents({
      showTree,
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
    { id: "material" as const, label: "Material", visible: Boolean(materialFile) },
  ].filter((pane) => pane.visible);

  const editorVisible =
    tabs.length > 0 && (isDesktopLayout || mobilePane === "editor");
  const materialVisible =
    Boolean(materialFile) && (isDesktopLayout || mobilePane === "material");
  const allReady =
    (!editorVisible || editorReady) && (!materialVisible || markdownReady);

  const editorPane = (
    <EditorPane
      tabs={tabs}
      activeTab={activeTab}
      showTabs={showTabs}
      EditorComponent={EditorComponent}
      renderLoadingPane={renderLoadingPane}
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
      `/workspace?course_id=${encodeURIComponent(courseId)}&uuid=${encodeURIComponent(nextTrackUuid)}`,
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

  const changeToNextTrack = async () => {
    const currentTrackIndex = tracks.findIndex((item) => item.uuid === uuid);
    const nextTrack = tracks[currentTrackIndex + 1];
    if (!nextTrack) return;

    setIsLoadingNextTrack(true);
    try {
      await waitForLoadingScreen();

      const headers = new Headers()
      headers.set("Content-Type", "application/json")
      await apiFetch("/courses/progress", {
        method: "POST",
        headers,
        body: JSON.stringify({ track_id: uuid, is_done: true }),
      })
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
          {TerminalPanelComponent ? (
            <TerminalPanelComponent onMaximize={toggleTerminalExpansion} />
          ) : (
            renderLoadingPane()
          )}
        </div>
      </Panel>
    </Group>
  );

  const mobileEditorPane = (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="min-h-0 flex-1">{editorPane}</div>
      <div className="h-[38%] min-h-48 overflow-hidden">
        {TerminalPanelComponent ? (
          <TerminalPanelComponent />
        ) : (
          renderLoadingPane()
        )}
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
            disabled={
              isLoadingNextTrack ||
              !nextTrack
            }
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

      <div
        className={`absolute inset-x-2 bottom-2 top-[52px] z-30 transition-[visibility] duration-300 ${isTracksMenuOpen ? "visible" : "invisible delay-300"
          }`}
        aria-hidden={!isTracksMenuOpen}
      >
        <button
          className={`absolute inset-0 cursor-default bg-neutral/20 transition-opacity duration-300 ${isTracksMenuOpen ? "opacity-100" : "opacity-0"
            }`}
          type="button"
          tabIndex={isTracksMenuOpen ? 0 : -1}
          aria-label="Close tracks drawer"
          onClick={() => setIsTracksMenuOpen(false)}
        />
        <aside
          id="workspace-tracks-drawer"
          className={`absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col border border-base-300 bg-base-100 shadow-xl transition-transform duration-300 ${isTracksMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          aria-label="Tracks"
        >
          <div className="flex items-center justify-between border-b border-base-300 px-4 py-3">
            <span className="font-semibold">Daftar Materi</span>
            <button
              className="btn btn-ghost btn-sm btn-square"
              type="button"
              tabIndex={isTracksMenuOpen ? 0 : -1}
              aria-label="Close tracks drawer"
              onClick={() => setIsTracksMenuOpen(false)}
            >
              <CircleX className="size-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {tracks.length === 0 ? (
              <p className="px-3 py-2 text-sm text-base-content/60">
                Tidak ada materi.
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {tracks.map((item) => {
                  const isActive = item.uuid === uuid;

                  return (
                    <button
                      key={item.uuid}
                      type="button"
                      tabIndex={isTracksMenuOpen ? 0 : -1}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex w-full items-center gap-2 rounded-btn px-3 py-2 text-left text-sm transition-colors ${isActive
                        ? "bg-primary text-primary-content"
                        : "hover:bg-base-200"
                        }`}
                      onClick={() => selectTrack(item.uuid)}
                    >
                      <span className="font-medium">{item.order}.</span>
                      <span className="truncate">{item.title}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>

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
                {FileTreeComponent ? (
                  <FileTreeComponent />
                ) : (
                  renderLoadingPane()
                )}
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
            {showTree && !isFileTreeCollapsed &&
              (
                <aside className="flex w-72 min-w-60 flex-col border-r border-base-300">
                  <div className="flex items-center justify-between border-b border-base-300 px-3 py-2">
                    <span className="text-sm font-medium">Berkas</span>
                  </div>
                  <div className="min-h-0 flex-1 overflow-hidden">
                    {FileTreeComponent ? (
                      <FileTreeComponent />
                    ) : (
                      renderLoadingPane()
                    )}
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
