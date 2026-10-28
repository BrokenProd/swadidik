import { useEffect, useRef } from "react";
import { Crepe } from "@milkdown/crepe";
import "./MarkdownEditor.css";

interface MarkdownEditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
  onReady?: () => void;
  readOnly?: boolean;
}

const MarkdownEditor = ({
  markdown,
  onChange,
  onReady,
  readOnly = false,
}: MarkdownEditorProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const initialMarkdownRef = useRef(markdown);
  const onChangeRef = useRef(onChange);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let disposed = false;
    const crepe = new Crepe({
      root,
      defaultValue: initialMarkdownRef.current,
      features: {
        [Crepe.Feature.TopBar]: !readOnly,
        [Crepe.Feature.Toolbar]: false,
      },
    });
    crepe.setReadonly(readOnly);
    crepe.on((listener) => {
      listener.markdownUpdated((_ctx, nextMarkdown) => {
        onChangeRef.current(nextMarkdown);
      });
    });

    const createEditor = async () => {
      await crepe.create();
      if (disposed) {
        await crepe.destroy();
        return;
      }
      onReadyRef.current?.();
    };

    void createEditor();

    return () => {
      disposed = true;
      void crepe.destroy();
    };
  }, [readOnly]);

  return (
    <article className="markdown-panel markdown-editor">
      <div ref={rootRef} />
    </article>
  );
};

export default MarkdownEditor;
