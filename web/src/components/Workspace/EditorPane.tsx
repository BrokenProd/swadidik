import type { JSX } from "react";
import type { WorkspaceFile } from "#/shared/files";
import { extToContentType } from "#/shared/files";
import WorkspaceTabs from "./WorkspaceTabs";
import type { EditorComponentType } from "./workspace.types";
import { Play } from "lucide-react";
import { apiFetch } from "#/shared/api";
import { useTerminalStore } from "#/components/Terminal/terminalStore";
import { useWorkspaceUiStore } from "./workspaceUiStore";

interface EditorPaneProps {
  tabs: WorkspaceFile[];
  activeTab?: string;
  showTabs?: boolean;
  EditorComponent: EditorComponentType | null;
  renderLoadingPane: () => JSX.Element;
  fileTreeToggle?: { collapsed: boolean; onToggle: () => void };
  onEditorReady?: () => void;
}

const EditorPane = ({
  tabs,
  activeTab,
  showTabs,
  EditorComponent,
  renderLoadingPane,
  fileTreeToggle,
  onEditorReady,
}: EditorPaneProps) => {
  const isRunning = useWorkspaceUiStore((state) => state.isRunning);
  const setRunning = useWorkspaceUiStore((state) => state.setRunning);
  const clearTerminal = useTerminalStore((state) => state.clear);
  const terminalOutput = useTerminalStore((state) => state.output);

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
      {(showTabs === undefined || showTabs) && <WorkspaceTabs fileTree={fileTreeToggle} />}
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="size-full">
          {tabs.map((file) => (
            <div
              key={file.filePath}
              className={`${activeTab === file.filePath ? "flex" : "hidden"} h-full flex-col`}
            >
              <div className="flex items-center justify-between border-b border-base-300 px-4 py-2">
                <div className="flex items-center gap-1">
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
                    Run
                  </button>

                  <p className="text-sm font-semibold pl-4">
                    {file.filePath.split("/").filter(Boolean).join(" / ")}
                  </p>
                </div>
              </div>
              <div className="size-full overflow-y-auto">
                {EditorComponent ? (
                  <EditorComponent
                    file={file}
                    onReady={
                      file.filePath === activeTab ? onEditorReady : undefined
                    }
                  />
                ) : (
                  renderLoadingPane()
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
