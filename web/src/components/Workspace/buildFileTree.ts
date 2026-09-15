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

export const buildFileTree = (files: WorkspaceFile[], folders: Set<string>): FileNode[] => {
  const root: FileNode[] = [];
  const folderMap = new Map<string, FileNode>();

  const sortedFiles = [...files].sort((a, b) => {
    return naturalCompare(a.filePath, b.filePath);
  });

  const allPaths = new Set<string>();

  folders.forEach(folder => {
    const parts = folder.split("/").filter(Boolean);
    let currentPath = "";

    parts.forEach((part, index) => {
      const isRootFolder = index === 0;
      currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;

      if (!allPaths.has(currentPath)) {
        allPaths.add(currentPath);

        let folder = folderMap.get(currentPath);
        if (!folder) {
          folder = {
            name: part,
            path: currentPath,
            type: "folder",
            children: [],
            isRoot: isRootFolder,
          };
          folderMap.set(currentPath, folder);
        }
      }
    });
  });

  sortedFiles.forEach((file) => {
    const parts = file.filePath.split("/").filter(Boolean);
    let currentPath = "";

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const isRootFolder = index === 0;
      currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;

      if (isFile) {
        allPaths.add(currentPath);
      } else {
        if (!allPaths.has(currentPath)) {
          allPaths.add(currentPath);

          let folder = folderMap.get(currentPath);
          if (!folder) {
            folder = {
              name: part,
              path: currentPath,
              type: "folder",
              children: [],
              isRoot: isRootFolder,
            };
            folderMap.set(currentPath, folder);
          }
        }
      }
    });
  });

  sortedFiles.forEach((file) => {
    const parts = file.filePath.split("/").filter(Boolean);
    let currentPath = "";
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;

      if (isFile) {
        currentLevel.push({
          name: part,
          path: currentPath,
          type: "file",
          file,
        });
      } else {
        const folder = folderMap.get(currentPath);
        if (folder) {
          if (!currentLevel.includes(folder)) {
            currentLevel.push(folder);
          }
          currentLevel = folder.children!;
        }
      }
    });
  });

  folders.forEach(folderPath => {
    const parts = folderPath.split("/").filter(Boolean);
    let currentPath = "";
    let currentLevel = root;

    parts.forEach((part) => {
      currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;
      const folder = folderMap.get(currentPath);

      if (folder) {
        if (!currentLevel.includes(folder)) {
          currentLevel.push(folder);
        }
        currentLevel = folder.children!;
      }
    });
  });

  sortFileNodes(root);

  const sortFolderChildren = (nodes: FileNode[]) => {
    nodes.forEach(node => {
      if (node.type === "folder" && node.children) {
        sortFileNodes(node.children);
        sortFolderChildren(node.children);
      }
    });
  };

  sortFolderChildren(root);

  return root;
};