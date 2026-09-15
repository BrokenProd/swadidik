import { useEffect, useState } from "react";
import type {
  TerminalPanelComponentType,
  EditorComponentType,
  FileTreeComponentType,
  MobilePane,
} from "./workspace.types";

interface UseLazyWorkspaceComponentsOptions {
  showTree: boolean;
  isDesktopLayout: boolean;
  mobilePane: MobilePane;
}

export const useLazyWorkspaceComponents = ({
  showTree,
  isDesktopLayout,
  mobilePane,
}: UseLazyWorkspaceComponentsOptions) => {
  const [EditorComponent, setEditorComponent] = useState<EditorComponentType | null>(null);
  const [FileTreeComponent, setFileTreeComponent] = useState<FileTreeComponentType | null>(null);
  const [TerminalPanelComponent, setTerminalPanelComponent] =
    useState<TerminalPanelComponentType | null>(null);

  useEffect(() => {
    if (EditorComponent) return;

    let cancelled = false;
    import("#/components/Editor").then((mod) => {
      if (!cancelled) {
        setEditorComponent(() => mod.default as EditorComponentType);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [EditorComponent]);

  useEffect(() => {
    const shouldLoad = showTree && (isDesktopLayout || mobilePane === "files");
    if (FileTreeComponent || !shouldLoad) return;

    let cancelled = false;
    import("./FileTree").then((mod) => {
      if (!cancelled) {
        setFileTreeComponent(() => mod.default as FileTreeComponentType);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [FileTreeComponent, isDesktopLayout, mobilePane, showTree]);

  useEffect(() => {
    const shouldLoad = isDesktopLayout || mobilePane === "editor";
    if (TerminalPanelComponent || !shouldLoad) return;

    let cancelled = false;
    import("./TerminalPanel").then((mod) => {
      if (!cancelled) {
        setTerminalPanelComponent(() => mod.default as TerminalPanelComponentType);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [TerminalPanelComponent, isDesktopLayout, mobilePane]);

  return {
    EditorComponent,
    FileTreeComponent,
    TerminalPanelComponent,
  };
};
