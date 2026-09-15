import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useWorkspaceStore } from "./store";
import type { WorkspaceFile } from "#/shared/files";

const Tab = ({
  file,
  isActive,
  showClose,
  onSelect,
  onClose,
}: {
  file: WorkspaceFile;
  isActive: boolean;
  showClose: boolean;
  onSelect: () => void;
  onClose: () => void;
}) => {
  const fileName = file.filePath.split("/").pop() || "untitled";
  const tabClass = !isActive ? "tab" : "tab tab-active";

  return (
    <div className="flex items-center min-w-[150px]">
      <button
        className={"w-full flex-nowrap " + tabClass}
        onClick={onSelect}
      >
        <p className="w-5/6 overflow-hidden font-semibold text-ellipsis">
          {fileName}
        </p>
      </button>

      {showClose && (
        <button
          className="btn btn-ghost btn-xs ml-1"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
};

const WorkspaceTabs = () => {
  const tabs = useWorkspaceStore((state) => state.tabs);
  const selectedTab = useWorkspaceStore((state) => state.selectedTab);
  const setSelectedTab = useWorkspaceStore((state) => state.setSelectedTab);
  const removeTab = useWorkspaceStore((state) => state.removeTab);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [canNavigateLeft, setCanNavigateLeft] = useState(currentIndex > 0 && tabs.length > 1);
  const [canNavigateRight, setCanNavigateRight] = useState(currentIndex < tabs.length - 1 && tabs.length > 1);

  const navigate = (direction: "left" | "right") => {
    const idx = tabs.findIndex(f => f.filePath === selectedTab);
    if (idx === -1) return;

    const newIndex = direction === "left" ? idx - 1 : idx + 1;
    if (newIndex >= 0 && newIndex < tabs.length) {
      setSelectedTab(tabs[newIndex].filePath);
      setCurrentIndex(newIndex);
      setCanNavigateLeft(newIndex > 0 && tabs.length > 1)
      setCanNavigateRight(newIndex < tabs.length - 1 && tabs.length > 1);
    }
  };

  useEffect(() => {
    const inner = async () => {
      const idx = tabs.findIndex(f => f.filePath === selectedTab);
      if (idx === -1) return;

      setCurrentIndex(idx);
      setCanNavigateLeft(idx > 0 && tabs.length > 1)
      setCanNavigateRight(idx < tabs.length - 1 && tabs.length > 1);
    }

    inner();
  }, [selectedTab, tabs])

  return (
    <div className="bg-base-200 border-b border-base-300 flex items-center gap-2 px-2">
      <div className="flex items-center gap-1 shrink-0">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate("left")}
          disabled={!canNavigateLeft}
          aria-label="Previous tab"
        >
          <ArrowLeft className="size-4" />
        </button>

        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate("right")}
          disabled={!canNavigateRight}
          aria-label="Next tab"
        >
          <ArrowRight className="size-4" />
        </button>
      </div>

      <div className="tabs tabs-bordered flex-1 overscroll-none overflow-x-auto overflow-y-hidden scrollbar-hide">
        <div className="flex">
          {tabs.map((file) => (
            <Tab
              key={file.filePath}
              file={file}
              isActive={selectedTab === file.filePath}
              showClose={tabs.length > 1}
              onSelect={() => {
                const idx = tabs.findIndex(t => t.filePath === file.filePath);
                setCurrentIndex(idx)
                setSelectedTab(file.filePath);
                setCanNavigateLeft(idx > 0 && tabs.length > 1);
                setCanNavigateRight(idx < tabs.length - 1 && tabs.length > 1);
              }}
              onClose={() => removeTab(file.filePath)}
            />
          ))}
        </div>
      </div>
    </div>
  )
};

export default WorkspaceTabs;
