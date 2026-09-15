import { useState, useMemo, useEffect } from "react";
import { File, FilePlus } from "lucide-react";
import { useFileSystemStore } from "./fileSystemStore";
import { useWorkspaceUiStore } from "./workspaceUiStore";
import type { WorkspaceFile } from "#/shared/files";
import { extToContentType } from "#/shared/files";
import { RenameDialog } from "./RenameDialog";
import { FileTreeNode, type FileNode } from "./FileTreeNode";
import { NewFileDialog } from "./NewFileDialog";
import { NewFolderDialog } from "./NewFolderDialog";
import { buildFileTree } from "./buildFileTree";

const FileTree = () => {
  const filesByPath = useFileSystemStore((state) => state.files);
  const files = useMemo(() => Object.values(filesByPath), [filesByPath]);
  const folders = useFileSystemStore((state) => state.folders);
  const createFile = useFileSystemStore((state) => state.createFile);
  const addFolder = useFileSystemStore((state) => state.addFolder);
  const renameEntry = useFileSystemStore((state) => state.renameEntry);
  const deleteEntry = useFileSystemStore((state) => state.deleteEntry);
  const selectedTab = useWorkspaceUiStore((state) => state.selectedTab);
  const openTab = useWorkspaceUiStore((state) => state.openTab);
  const editableWorkspace = useWorkspaceUiStore((state) => state.config.editable);
  const expandedFolders = useWorkspaceUiStore((state) => state.expandedFolders);
  const setExpandedFolders = useWorkspaceUiStore((state) => state.setExpandedFolders);

  const [renameDialog, setRenameDialog] = useState<{
    path: string;
    name: string;
    isFolder: boolean;
  } | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    path: string;
    isFolder: boolean;
  } | null>(null);

  const [showNewFileDialog, setShowNewFileDialog] = useState<string | null>(null);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState<string | null>(null);

  const fileTree = useMemo(() => buildFileTree(files, folders), [files, folders]);

  // initialize all folders as expanded when the tree changes and no folders are expanded yet
  useEffect(() => {
    if (fileTree.length > 0 && expandedFolders.size === 0) {
      const allFolderPaths = new Set<string>();
      const collectFolderPaths = (nodes: FileNode[]) => {
        nodes.forEach((node) => {
          if (node.type === "folder") {
            allFolderPaths.add(node.path);
            if (node.children) {
              collectFolderPaths(node.children);
            }
          }
        });
      };
      collectFolderPaths(fileTree);
      if (allFolderPaths.size > 0) {
        setExpandedFolders(allFolderPaths);
      }
    }
  }, [fileTree, expandedFolders.size, setExpandedFolders]);

  const handleFileSelect = (file: WorkspaceFile) => {
    openTab(file.filePath);
  };

  const handleRename = (path: string, isFolder: boolean) => {
    const name = path.split("/").pop() || "";
    setRenameDialog({ path, name, isFolder });
  };

  const handleRenameSubmit = (oldPath: string, newName: string) => {
    const pathParts = oldPath.split("/");
    pathParts[pathParts.length - 1] = newName;
    const newPath = pathParts.join("/");

    renameEntry(oldPath, newPath, renameDialog?.isFolder ?? false);
  };

  const handleDelete = (path: string, isFolder: boolean) => {
    setDeleteConfirm({ path, isFolder });
  };

  const confirmDelete = (path: string, isFolder: boolean) => {
    deleteEntry(path, isFolder);
    setDeleteConfirm(null);
  };

  const handleNewFile = async (parentPath: string, fileName: string) => {
    const newFilePath = `${parentPath}/${fileName}`;

    if (filesByPath[newFilePath]) {
      return;
    }

    const contentType = extToContentType(newFilePath);

    const newFile: WorkspaceFile = {
      filePath: newFilePath,
      content: "",
      contentType,
    };

    if (createFile(newFile)) openTab(newFilePath);
  };

  const handleNewFolder = async (parentPath: string, folderName: string) => {
    const newFolderPath = `${parentPath}/${folderName}`;

    if (folders.has(newFolderPath)) {
      return;
    }

    addFolder(newFolderPath);
  };

  const getRootPath = () => {
    return fileTree.length > 0 && fileTree[0].type === "folder"
      ? fileTree[0].path
      : "/workspace";
  };

  return (
    <>
      <div className="flex flex-col h-full bg-base-100 border-r border-base-300">
        <div className="flex-1 overflow-y-auto">
          {fileTree.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <File className="size-8 opacity-30 mb-2" />
              <p className="text-sm opacity-60">No files</p>
              {editableWorkspace &&
                <button
                  className="btn btn-sm btn-primary mt-3"
                  onClick={() => setShowNewFileDialog(getRootPath())}
                >
                  <FilePlus className="size-4" />
                  Create File
                </button>}
            </div>
          ) : (
            fileTree.map((node) => (
              <FileTreeNode
                key={node.path}
                node={node}
                level={0}
                onFileSelect={handleFileSelect}
                onAddFolder={(path) => setShowNewFolderDialog(path)}
                onAddFile={(path) => setShowNewFileDialog(path)}
                onRename={handleRename}
                onDelete={handleDelete}
                selectedPath={selectedTab}
              />
            ))
          )}
        </div>
      </div>

      {showNewFileDialog && (
        <NewFileDialog
          parentPath={showNewFileDialog}
          onConfirm={(fileName) => handleNewFile(showNewFileDialog, fileName)}
          onClose={() => setShowNewFileDialog(null)}
        />
      )}

      {editableWorkspace && showNewFolderDialog && (
        <NewFolderDialog
          parentPath={showNewFolderDialog}
          onConfirm={(folderName) => handleNewFolder(showNewFolderDialog, folderName)}
          onClose={() => setShowNewFolderDialog(null)}
        />
      )}

      {renameDialog && (
        <RenameDialog
          currentName={renameDialog.name}
          onRename={(newName) => handleRenameSubmit(renameDialog.path, newName)}
          onClose={() => setRenameDialog(null)}
        />
      )}

      {deleteConfirm && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              Delete {deleteConfirm.isFolder ? "Folder" : "File"}
            </h3>
            <p className="py-4">
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {deleteConfirm.path.split("/").pop()}
              </span>
              {deleteConfirm.isFolder ? " and all files inside it" : ""}? This action cannot be undone.
            </p>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={() =>
                  confirmDelete(deleteConfirm.path, deleteConfirm.isFolder)
                }
              >
                Delete
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => setDeleteConfirm(null)}
          ></div>
        </div>
      )}
    </>
  );
};

export default FileTree;
