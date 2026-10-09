import { useEffect, useRef, useState } from "react";
import { EditorView } from "codemirror";
import type { WorkspaceFile } from "#/shared/files";
import { extToContentType } from "#/shared/files";
import { EditorState } from "@codemirror/state";
import { setupExtensions } from "./setup";
import { loadTheme } from "#/shared/themes";
import { useFileSystemStore } from "#/components/Workspace/fileSystemStore";
import { useWorkspaceUiStore } from "#/components/Workspace/workspaceUiStore";
import {
  getEditor,
  getEditorPath,
} from "#/components/Workspace/editorRegistry";
import type { ViewUpdate } from "@codemirror/view";

const initializedViews = new WeakSet<EditorView>();

interface EditorProps {
  file: WorkspaceFile;
  autoSaveTimer?: number;
}

const Editor = ({ file }: EditorProps) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const editorViewRef = useRef<EditorView | null>(null);

  const [isInitializing, setInitializing] = useState(false);
  const appearance = useWorkspaceUiStore((state) => state.appearance);
  const updateFileContent = useFileSystemStore(
    (state) => state.updateFileContent,
  );

  // initialize
  useEffect(() => {
    if (isInitializing || !editorRef.current || editorViewRef.current) {
      return;
    }

    const initializeEditor = async () => {
      try {
        const { fontFamily, fontSize, editorTheme } = appearance;
        const initialTheme = await loadTheme(fontFamily, fontSize, editorTheme);
        const baseExtensions = await setupExtensions(
          extToContentType(file.filePath),
        );

        const exts = [
          ...baseExtensions,
          getEditor(file.filePath).themeCompartment.of(initialTheme),
          // update file from changes
          EditorView.updateListener.of((v: ViewUpdate) => {
            if (v.docChanged) {
              const path = getEditorPath(v.view);
              if (path) updateFileContent(path, v.state.doc.toString());
            }
          }),
        ];

        const view = getEditor(file.filePath).view;
        editorViewRef.current = view;

        if (!editorRef.current!.contains(view.dom)) {
          editorRef.current!.appendChild(view.dom);
        }

        // Do not reset content on layout remounts: initialize each view only once.
        if (!initializedViews.has(view)) {
          view.setState(
            EditorState.create({
              doc: file.content,
              extensions: exts,
            }),
          );
          initializedViews.add(view);
        }

        view.requestMeasure();

        setInitializing(true);
      } catch (error) {
        console.error("Editor initialization failed:", error);
      }
    };

    initializeEditor();
  });

  return <div className="size-full" ref={editorRef} />;
};

export default Editor;
