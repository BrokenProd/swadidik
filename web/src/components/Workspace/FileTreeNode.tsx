import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FilePlus,
  FolderPlus,
  Pen,
  Trash2,
} from "lucide-react";
import FileTypeIcon from "#/components/FileTypeIcon";
import type { WorkspaceFile } from "#/shared/files";
import { useWorkspaceUiStore } from "./workspaceUiStore";

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
  file?: WorkspaceFile;
  isRoot?: boolean;
}

interface FileTreeNodeProps {
  node: FileNode;
  level: number;
  onFileSelect: (file: WorkspaceFile) => void;
  onAddFolder: (parentPath: string) => void;
  onAddFile: (parentPath: string) => void;
  onRename: (path: string, isFolder: boolean) => void;
  onDelete: (path: string, isFolder: boolean) => void;
  selectedPath: string | null;
}

export const FileTreeNode = ({
  node,
  level,
  onFileSelect,
  onAddFolder,
  onAddFile,
  onRename,
  onDelete,
  selectedPath,
}: FileTreeNodeProps) => {
  const expandedFolders = useWorkspaceUiStore(state => state.expandedFolders);
  const toggleFolderExpanded = useWorkspaceUiStore(state => state.toggleFolderExpanded);
  const [isHovered, setIsHovered] = useState(false);

  const isSelected = selectedPath === node.path;
  const paddingLeft = level * 12;
  const isRoot = node.isRoot;

  const editableWorkspace = useWorkspaceUiStore(state => state.config.editable);

  // check if this folder is expanded from the store
  const isOpen = isRoot || expandedFolders.has(node.path);

  if (node.type === "file" && node.file) {
    return (
      <div
        className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-primary/20 transition-colors ${isSelected ? "bg-base-300" : ""
          }`}
        style={{ paddingLeft: `${paddingLeft + 8}px` }}
        onClick={() => onFileSelect(node.file!)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <FileTypeIcon language={node.file.contentType} />
        <span className="text-sm flex-1 truncate">{node.name}</span>

        {editableWorkspace && (
          <div
            className={`flex gap-0.5 shrink-0 transition-opacity ${isHovered ? "opacity-100" : "opacity-0"
              }`}
          >
            <button
              className="btn btn-ghost btn-xs btn-square"
              onClick={(e) => {
                e.stopPropagation();
                onRename(node.path, false);
              }}
              title="Rename"
            >
              <Pen className="size-3.5" />
            </button>

            <button
              className="btn btn-ghost btn-xs btn-square text-error hover:bg-error/10"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(node.path, false);
              }}
              title="Delete"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  if (node.type === "folder") {
    return (
      <div>
        <div
          className={`flex items-center gap-2 px-2 py-1.5 transition-colors group cursor-pointer hover:bg-primary/30 ${isSelected ? "bg-base-300" : ""
            }`}
          style={{ paddingLeft: `${paddingLeft + 8}px` }}
          onClick={() => !isRoot && toggleFolderExpanded(node.path)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {!isRoot && (
            <>
              {isOpen ? (
                <ChevronDown className="size-4 shrink-0" />
              ) : (
                <ChevronRight className="size-4 shrink-0" />
              )}
            </>
          )}
          {isOpen ? (
            <FolderOpen className="size-4 shrink-0 text-primary" />
          ) : (
            <Folder className="size-4 shrink-0 text-primary" />
          )}
          <span className="text-sm font-medium flex-1 truncate">{node.name}</span>

          {editableWorkspace && (
            <div
              className={`flex gap-0.5 shrink-0 transition-opacity ${isHovered ? "opacity-100" : "opacity-0"
                }`}
            >
              <button
                className="btn btn-ghost btn-xs btn-square"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddFile(node.path);
                }}
                title="New File"
              >
                <FilePlus className="size-3.5" />
              </button>
              <button
                className="btn btn-ghost btn-xs btn-square"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddFolder(node.path);
                }}
                title="New Folder"
              >
                <FolderPlus className="size-3.5" />
              </button>
              {!isRoot && (
                <>
                  <button
                    className="btn btn-ghost btn-xs btn-square"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRename(node.path, true);
                    }}
                    title="Rename"
                  >
                    <Pen className="size-3.5" />
                  </button>
                  <button
                    className="btn btn-ghost btn-xs btn-square text-error hover:bg-error/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(node.path, true);
                    }}
                    title="Delete"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        {isOpen && node.children && (
          <div>
            {node.children.map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                level={level + 1}
                onFileSelect={onFileSelect}
                onAddFolder={onAddFolder}
                onAddFile={onAddFile}
                onRename={onRename}
                onDelete={onDelete}
                selectedPath={selectedPath}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
};
