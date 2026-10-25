import type { WorkspaceFile } from "#/shared/files";
import type { FileNode } from "./FileTreeNode";
import { naturalCompare } from "#/utils/sort";

const sortFileNodes = (nodes: FileNode[]): FileNode[] => {
  return nodes.sort((a, b) => {
    // directories come before files
    if (a.type === "folder" && b.type === "file") return -1;
    if (a.type === "file" && b.type === "folder") return 1;

    return naturalCompare(a.name, b.name);
  });
};

export const buildFileTree = (
  files: WorkspaceFile[],
  folders: Set<string>,
): FileNode[] => {
  const root: FileNode[] = [];
  const folderMap = new Map<string, FileNode>();

  const ensureFolderChain = (parts: string[]) => {
    let currentPath = "";
    let currentLevel = root;

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;
      let folder = folderMap.get(currentPath);
      if (!folder) {
        folder = {
          name: part,
          path: currentPath,
          type: "folder",
          children: [],
          isRoot: index === 0,
        };
        folderMap.set(currentPath, folder);
        currentLevel.push(folder);
      }
      currentLevel = folder.children!;
    });

    return currentLevel;
  };

  folders.forEach((folderPath) => {
    ensureFolderChain(folderPath.split("/").filter(Boolean));
  });

  files.forEach((file) => {
    const parts = file.filePath.split("/").filter(Boolean);
    const fileName = parts.pop();
    if (!fileName) return;

    const parent = ensureFolderChain(parts);
    parent.push({
      name: fileName,
      path: file.filePath,
      type: "file",
      file,
    });
  });

  sortFileNodes(root);

  const sortFolderChildren = (nodes: FileNode[]) => {
    nodes.forEach((node) => {
      if (node.type === "folder" && node.children) {
        sortFileNodes(node.children);
        sortFolderChildren(node.children);
      }
    });
  };

  sortFolderChildren(root);

  return root;
};
