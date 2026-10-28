import { lazy, Suspense, type ComponentType } from "react";
import type { WorkspaceFile } from "#/shared/files";
import { extToContentType } from "#/shared/files";
import WorkspaceTabs from "./WorkspaceTabs";
import { Play } from "lucide-react";
import { apiFetch } from "#/shared/api";
import { useTerminalStore } from "#/components/Terminal/terminalStore";
import { useFileSystemStore } from "./fileSystemStore";
import { useWorkspaceUiStore } from "./workspaceUiStore";

interface EditorPaneProps {
  tabs: WorkspaceFile[];
  activeTab?: string;
  showTabs?: boolean;
  EditorComponent: ComponentType<{ file: WorkspaceFile; onReady?: () => void }>;
  fileTreeToggle?: { collapsed: boolean; onToggle: () => void };
  onEditorReady?: () => void;
}

const MarkdownEditor = lazy(() => import("#/components/MarkdownEditor"))

const EditorPane = ({
  tabs,
  activeTab,
  showTabs,
  EditorComponent,
  fileTreeToggle,
  onEditorReady,
}: EditorPaneProps) => {
  const isRunning = useWorkspaceUiStore((state) => state.isRunning);
  const setRunning = useWorkspaceUiStore((state) => state.setRunning);
  const editableWorkspace = useWorkspaceUiStore(
    (state) => state.config.editable,
  );
  const clearTerminal = useTerminalStore((state) => state.clear);
  const terminalOutput = useTerminalStore((state) => state.output);
  const updateFileContent = useFileSystemStore(
    (state) => state.updateFileContent,
  );

  const handleRun = async (file: WorkspaceFile) => {
    const language = extToContentType(file.filePath);
    if (language === "markdown" || language === "plaintext") return;

    const sourceFiles = tabs
      .filter(
        (sourceFile) => extToContentType(sourceFile.filePath) === language,
      )
      .map(({ filePath, content }) => ({ filePath, content }));

    setRunning(true);
    clearTerminal();

    try {
      const response = await apiFetch("/invoke/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          files: sourceFiles,
          active_file: file.filePath,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const { output } = (await response.json()) as { output: string };
      terminalOutput(output || "Program completed with no output.");
    } catch (error) {
      terminalOutput(
        "",
        error instanceof Error ? error.message : "Unable to run the program.",
      );
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="h-full flex min-h-0 flex-1 flex-col bg-base-100">
      {(showTabs === undefined || showTabs) && (
        <WorkspaceTabs fileTree={fileTreeToggle} />
      )}
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="size-full">
          {tabs.map((file) => (
            <div
              key={file.filePath}
              className={`${activeTab === file.filePath ? "flex" : "hidden"} h-full flex-col`}
            >
              <div className="flex items-center justify-between border-b border-base-300 px-4 py-2">
                <div className="flex items-center gap-1">
                  {extToContentType(file.filePath) !== "markdown" &&
                    extToContentType(file.filePath) !== "plaintext" && (
                      <button
                        className="btn btn-neutral btn-sm"
                        onClick={() => handleRun(file)}
                        disabled={isRunning}
                        title="Run"
                      >
                        {isRunning ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <Play className="size-4" />
                        )}
                        Jalankan
                      </button>
                    )}

                  <p className="text-sm font-semibold pl-4">
                    {file.filePath.split("/").filter(Boolean).join(" / ")}
                  </p>
                </div>
              </div>
              <div className="size-full overflow-hidden">
                {extToContentType(file.filePath) === "markdown" ? (
                  <Suspense fallback={<div className="flex h-full items-center justify-center"><span className="loading loading-spinner" /></div>}>
                    <MarkdownEditor
                      markdown={file.content}
                      onChange={(content) =>
                        updateFileContent(file.filePath, content)
                      }
                      readOnly={!editableWorkspace}
                      onReady={
                        file.filePath === activeTab ? onEditorReady : undefined
                      }
                    />
                  </Suspense>
                ) : (
                  <div className="size-full overflow-y-auto">
                    <EditorComponent
                      file={file}
                      onReady={
                        file.filePath === activeTab ? onEditorReady : undefined
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EditorPane;
