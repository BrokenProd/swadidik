import { useRef, useState } from "react";
import type { JSX } from "react";
import { isMaterialFile, type WorkspaceFile } from "#/shared/files";
import { Group, Panel, Separator } from "react-resizable-panels";
import type { GroupImperativeHandle, Layout } from "react-resizable-panels";
import {
  ChevronLeft,
  ChevronRight,
  CircleX,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useNavigate } from "react-router";
import MarkdownPanel from "#/components/MarkdownPanel";
import LoadingHolder from "./LoadingHolder";
import { useFileSystemStore } from "./fileSystemStore";
import { useWorkspaceUiStore } from "./workspaceUiStore";
import EditorPane from "./EditorPane";
import { useDesktopLayout } from "./useDesktopLayout";
import { useLazyWorkspaceComponents } from "./useLazyWorkspaceComponents";
import { useWorkspaceInitialization } from "./useWorkspaceInitialization";
import { useActiveWorkspaceTab } from "./useActiveWorkspaceTab";
import type { MobilePane } from "./workspace.types";
import EditorSettings from "./EditorSettings";
import { useTerminalStore } from "#/components/Terminal/terminalStore";

interface Props {
  uuid: string;
  track: string | number;
  showFileTree?: boolean;
  showTabs?: boolean;
  editable?: boolean;
}

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

const Workspace = ({ uuid, track, showFileTree, showTabs, editable }: Props) => {
  const navigate = useNavigate();
  const [maximizeTerminal, setMaximizeTerminal] = useState(false);
  const [isFileTreeCollapsed, setIsFileTreeCollapsed] = useState(false);
  const [mobilePane, setMobilePane] = useState<MobilePane>("editor");
  const [terminalLayout, setTerminalLayout] = useState<Layout>({
    [PANEL_IDS.editor]: 70,
    [PANEL_IDS.terminal]: 30,
  });
  const groupRef = useRef<GroupImperativeHandle>(null);
  const layoutBeforeTerminalExpansion = useRef<Layout>(terminalLayout);
  const isDesktopLayout = useDesktopLayout();

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

  const { isInitialized, status, nextTrackStatus } = useWorkspaceInitialization({
    uuid,
    track,
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

  if (status === "loading") return <LoadingHolder />;
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

  const editorPane = (
    <EditorPane
      tabs={tabs}
      activeTab={activeTab}
      showTabs={showTabs}
      EditorComponent={EditorComponent}
      renderLoadingPane={renderLoadingPane}
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

  const changeTrack = (offset: number) => {
    if (offset < 0) {
      const numTrack = +track
      if (isNaN(numTrack)) return
      if ((+track + offset) <= 0) return
    }

    clearTerminal();
    const query = new URLSearchParams(window.location.search);
    query.set("track", String(Number(track) + offset));
    navigate({ search: `?${query.toString()}` });
  };

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
    <div className="flex h-full flex-col bg-base-200/50 p-2">
      <header className="flex h-11 shrink-0 items-center justify-between border border-base-300 bg-base-100 px-2">
        <nav className="flex items-center gap-1" aria-label="Track navigation">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => changeTrack(-1)}
            aria-label="Previous track"
            title="Previous"
            disabled={isNaN(+track) || +track <= 1}
          >
            <ChevronLeft className="size-5" />
            Back
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => changeTrack(1)}
            aria-label="Next track"
            title="Next"
            disabled={nextTrackStatus !== "available"}
          >
            Next
            <ChevronRight />
          </button>

          <EditorSettings />
        </nav>
      </header>

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
                <div className="border-b border-base-300 px-4 py-2 text-sm font-medium">
                  Material
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <MarkdownPanel markdown={materialFile?.content ?? ""} />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {isDesktopLayout && (
        <div className="min-h-0 flex-1">
          <div className="flex h-full min-w-0">
            {showTree &&
              (isFileTreeCollapsed ? (
                <div className="flex w-10 shrink-0 justify-center border-r border-base-300 pt-2">
                  <button
                    className="btn btn-ghost btn-sm btn-square"
                    onClick={() => setIsFileTreeCollapsed(false)}
                    aria-label="Expand file manager"
                    aria-expanded="false"
                  >
                    <PanelLeftOpen className="size-4" />
                  </button>
                </div>
              ) : (
                <aside className="flex w-72 min-w-60 flex-col border-r border-base-300">
                  <div className="flex items-center justify-between border-b border-base-300 px-3 py-2">
                    <span className="text-sm font-medium">Files</span>
                    <button
                      className="btn btn-ghost btn-sm btn-square"
                      onClick={() => setIsFileTreeCollapsed(true)}
                      aria-label="Collapse file manager"
                      aria-expanded="true"
                    >
                      <PanelLeftClose className="size-4" />
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-hidden">
                    {FileTreeComponent ? (
                      <FileTreeComponent />
                    ) : (
                      renderLoadingPane()
                    )}
                  </div>
                </aside>
              ))}

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
                      <MarkdownPanel markdown={materialFile.content} />
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
    </div>
  );
};

export default Workspace;
