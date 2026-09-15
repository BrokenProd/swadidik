import { Compartment } from "@codemirror/state";
import { EditorView } from "codemirror";

type EditorHandle = { view: EditorView; themeCompartment: Compartment };

const editors = new Map<string, EditorHandle>();
const viewPaths = new WeakMap<EditorView, string>();

export const getEditor = (path: string): EditorHandle => {
  let editor = editors.get(path);
  if (!editor) {
    editor = { view: new EditorView(), themeCompartment: new Compartment() };
    editors.set(path, editor);
    viewPaths.set(editor.view, path);
  }
  return editor;
};

export const getEditorPath = (view: EditorView) => viewPaths.get(view);

export const renameEditor = (oldPath: string, newPath: string) => {
  const editor = editors.get(oldPath);
  if (!editor) return;
  editors.delete(oldPath);
  editors.set(newPath, editor);
  viewPaths.set(editor.view, newPath);
};

export const removeEditor = (path: string) => {
  const editor = editors.get(path);
  if (!editor) return;
  editor.view.destroy();
  editors.delete(path);
};

export const clearEditors = () => {
  editors.forEach(({ view }) => view.destroy());
  editors.clear();
};
