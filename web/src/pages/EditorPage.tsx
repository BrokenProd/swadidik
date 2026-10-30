import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Save } from "lucide-react";
import { Group, Panel, Separator, type PanelImperativeHandle } from "react-resizable-panels";
import Editor from "#/components/Editor";
import EditorPane from "#/components/Workspace/EditorPane";
import FileTree from "#/components/Workspace/FileTree";
import { useFileSystemStore } from "#/components/Workspace/fileSystemStore";
import { useWorkspaceUiStore } from "#/components/Workspace/workspaceUiStore";
import EditorSettings from "#/components/Workspace/EditorSettings.tsx";

const MarkdownEditor = lazy(() => import("#/components/MarkdownEditor"));


const EditorPage = () => {
  const [markdown, setMarkdown] = useState("");
  const [isFileTreeCollapsed, setIsFileTreeCollapsed] = useState(false);
  const fileTreePanelRef = useRef<PanelImperativeHandle | null>(null);

  const files = useFileSystemStore((state) => state.files);
  const tabPaths = useWorkspaceUiStore((state) => state.tabs);
  const selectedTab = useWorkspaceUiStore((state) => state.selectedTab);

  const tabs = tabPaths.map((path) => files[path]).filter(Boolean);

  useEffect(() => {
    if (fileTreePanelRef.current) {
      if (isFileTreeCollapsed) {
        fileTreePanelRef.current.collapse();
      } else {
        fileTreePanelRef.current.expand();
      }
    }
  }, [isFileTreeCollapsed]);

  return (
    <div className="flex h-screen flex-col bg-base-200 p-2">
      <header className="flex h-11 shrink-0 items-center justify-between border border-base-300 bg-base-100 px-3">
        <div>
          <button className="btn btn-primary btn-sm">
            <Save /> Simpan
          </button>

          <EditorSettings/>
        </div>
        <Link to="/" className="btn btn-ghost btn-sm">
          Back to courses
        </Link>
      </header>

      <main className="mt-2 flex min-h-0 flex-1 overflow-hidden border border-base-300 bg-base-100">
        <Group orientation="horizontal" className="w-full h-full">
          <Panel
            defaultSize={25}
            minSize={20}
            collapsible
            collapsedSize={0}
            panelRef={fileTreePanelRef}
            className="min-w-0"
          >
            <aside className="w-full h-full border-r border-base-300">
              <div className="border-b border-base-300 px-3 py-2 text-sm font-medium">
                Files
              </div>
              <div className="h-[calc(100%-2.5rem)] min-h-0 overflow-hidden">
                <FileTree />
              </div>
            </aside>
          </Panel>
          <Separator className="w-2 bg-base-300 hover:bg-primary cursor-col-resize active:bg-primary active:opacity-50" />
          <Panel defaultSize={50} minSize={30} className="min-w-0">
            <EditorPane
              tabs={tabs}
              activeTab={selectedTab}
              EditorComponent={Editor}
              fileTreeToggle={{
                collapsed: isFileTreeCollapsed,
                onToggle: () => setIsFileTreeCollapsed((c) => !c),
              }}
            />
          </Panel>
          <Separator className="w-2 bg-base-300 hover:bg-primary cursor-col-resize active:bg-primary active:opacity-50" />
          <Panel defaultSize={25} minSize={20} className="min-w-0">
            <div className="h-full overflow-hidden dark:bg-[#1a1b26] light:bg-[#1a1b26]">
              <input className="input w-[98%] m-2 dark:bg-[#1a1b26] light:bg-[#1a1b26] text-base-content" placeholder="Judul" />

              <Suspense fallback={<div className="flex h-full items-center justify-center"><span className="loading loading-spinner" /></div>}>
                  <MarkdownEditor markdown={markdown} onChange={setMarkdown} />
              </Suspense>
            </div>
          </Panel>
        </Group>
      </main>
    </div>
  );
};

export default EditorPage;
