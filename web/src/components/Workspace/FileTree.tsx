import { useState, useMemo, useEffect } from "react";
import { File, FilePlus } from "lucide-react";
import { useWorkspaceStore } from "./store";
import type { WorkspaceFile } from "#/shared/files";
import { extToContentType } from "#/shared/files";
import { RenameDialog } from "./RenameDialog";
import { FileTreeNode, type FileNode } from "./FileTreeNode";
import { NewFileDialog } from "./NewFileDialog";
import { NewFolderDialog } from "./NewFolderDialog";
import { buildFileTree } from "./buildFileTree";

const isSameOrDescendantPath = (candidatePath: string, targetPath: string) => {
  return candidatePath === targetPath || candidatePath.startsWith(`${targetPath}/`);
};

const FileTree = () => {
  const files = useWorkspaceStore((state) => state.files);
  const folders = useWorkspaceStore((state) => state.folders);
  const selectedTab = useWorkspaceStore((state) => state.selectedTab);
  const setSelectedTab = useWorkspaceStore((state) => state.setSelectedTab);
  const renameFile = useWorkspaceStore((state) => state.renameFile);
  const removeTab = useWorkspaceStore((state) => state.removeTab);
  const deleteFile = useWorkspaceStore((state) => state.deleteFile);
  const setTabs = useWorkspaceStore((state) => state.setTabs);
  const createFile = useWorkspaceStore((state) => state.createFile);
  const fileIndex = useWorkspaceStore((state) => state.fileIndex);
  const addFolder = useWorkspaceStore((state) => state.addFolder);
  const deleteFolder = useWorkspaceStore((state) => state.deleteFolder);
  const renameFolder = useWorkspaceStore((state) => state.renameFolder);
  const editableWorkspace = useWorkspaceStore((state) => state.config.editable);
  const expandedFolders = useWorkspaceStore((state) => state.expandedFolders);
  const setExpandedFolders = useWorkspaceStore((state) => state.setExpandedFolders);

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
    setSelectedTab(file.filePath);
    const tabs = useWorkspaceStore.getState().tabs;
    if (!tabs.some((t) => t.filePath === file.filePath)) {
      setTabs([...tabs, file]);
    }
  };

  const handleRename = (path: string, isFolder: boolean) => {
    const name = path.split("/").pop() || "";
    setRenameDialog({ path, name, isFolder });
  };

  const handleRenameSubmit = (oldPath: string, newName: string) => {
    const pathParts = oldPath.split("/");
    pathParts[pathParts.length - 1] = newName;
    const newPath = pathParts.join("/");

    if (renameDialog?.isFolder) {
      renameFolder(oldPath, newPath);

      files.
        filter((f) => f.filePath.startsWith(oldPath)).
        forEach((file) => {
          const relativePath = file.filePath.substring(oldPath.length);
          const newFilePath = newPath + relativePath;
          renameFile(file.filePath, newFilePath);
        });
    } else {
      renameFile(oldPath, newPath);
    }
  };

  const handleDelete = (path: string, isFolder: boolean) => {
    setDeleteConfirm({ path, isFolder });
  };

  const confirmDelete = async (path: string, isFolder: boolean) => {
    if (isFolder) {
      deleteFolder(path);

      await Promise.all(files
        .filter((f) => isSameOrDescendantPath(f.filePath, path))
        .map(async (file) => {
          removeTab(file.filePath);
          await deleteFile(file.filePath);
        }));
    } else {
      removeTab(path);
      await deleteFile(path);
    }
    setDeleteConfirm(null);
  };

  const handleNewFile = async (parentPath: string, fileName: string) => {
    const newFilePath = `${parentPath}/${fileName}`;

    if (fileIndex.has(newFilePath)) {
      return;
    }

    const contentType = extToContentType(newFilePath);

    const { EditorView } = await import("codemirror");
    const { Compartment } = await import("@codemirror/state");

    const newFile: WorkspaceFile = {
      filePath: newFilePath,
      content: "",
      contentType,
      view: new EditorView(),
      themeCompartment: new Compartment(),
    };

    createFile(newFile);

    const tabs = useWorkspaceStore.getState().tabs;
    setTabs([...tabs, newFile]);
    setSelectedTab(newFilePath);
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