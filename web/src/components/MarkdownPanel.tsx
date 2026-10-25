import { useEffect, useRef } from "react";
import { Crepe } from "@milkdown/crepe";
import "./MarkdownPanel.css";

interface Props {
  markdown: string;
  onReady?: () => void;
}

const MarkdownPanel = ({ markdown, onReady }: Props) => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let disposed = false;
    const crepe = new Crepe({
      root,
      defaultValue: markdown,
      features: {
        [Crepe.Feature.BlockEdit]: false,
        [Crepe.Feature.Cursor]: false,
        [Crepe.Feature.Toolbar]: false,
      },
    });
    crepe.setReadonly(true);

    const createEditor = async () => {
      await crepe.create();
      if (disposed) {
        await crepe.destroy();
        return;
      }
      onReady?.();
    };

    void createEditor();

    return () => {
      disposed = true;
      void crepe.destroy();
    };
  }, [markdown, onReady]);

  return (
    <article className="markdown-panel">
      <div ref={rootRef} />
    </article>
  );
};

export default MarkdownPanel;
