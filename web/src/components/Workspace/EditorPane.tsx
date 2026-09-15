import type { JSX } from "react";
import type { WorkspaceFile } from "#/shared/files";
import WorkspaceTabs from "./WorkspaceTabs";
import type { EditorComponentType } from "./workspace.types";
import EditorSettings from "./EditorSettings";

interface EditorPaneProps {
  tabs: WorkspaceFile[];
  activeTab?: string;
  showTabs?: boolean;
  EditorComponent: EditorComponentType | null;
  renderLoadingPane: () => JSX.Element;
}

const EditorPane = ({
  tabs,
  activeTab,
  showTabs,
  EditorComponent,
  renderLoadingPane,
}: EditorPaneProps) => {
  return (
    <div className="h-full flex min-h-0 flex-1 flex-col bg-base-100">
      {(showTabs === undefined || showTabs) && <WorkspaceTabs />}
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="size-full">
          {tabs.map((file) => (
            <div
              key={file.filePath}
              className={`${activeTab === file.filePath ? "flex" : "hidden"} h-full flex-col`}
            >
              <div className="flex items-center justify-between border-b border-base-300 px-4 py-2">
                <p className="text-sm font-semibold">
                  {file.filePath.split("/").filter(Boolean).join(" / ")}
                </p>

                <EditorSettings />
              </div>
              <div className="size-full overflow-y-auto">
                {EditorComponent ? <EditorComponent file={file} /> : renderLoadingPane()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EditorPane;
