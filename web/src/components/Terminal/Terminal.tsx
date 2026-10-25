import { useCallback, useEffect, useRef } from "react";
import { useTerminalStore } from "./terminalStore";
import { useWorkspaceUiStore } from "#/components/Workspace/workspaceUiStore";
import { getEditorThemeSettings } from "#/shared/themes";
import loadFont from "#/fonts";
import { BrushCleaning } from "lucide-react";

const Terminal = () => {
  const appearance = useWorkspaceUiStore((state) => state.appearance);

  const clearTerminal = useTerminalStore((state) => state.clear);
  const history = useTerminalStore((state) => state.history);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const updateTheme = useCallback(async () => {
    if (!containerRef.current) return;

    const { fontSize, editorTheme } = appearance;

    const settings = await getEditorThemeSettings(editorTheme);
    await loadFont(fontSize);

    const style = containerRef.current.style;
    style.fontFamily = "JetBrains Mono";
    style.fontSize = `${fontSize}px`;
    style.color = settings.foreground ?? "#fff";
    style.backgroundColor = settings.background ?? "#1a1b26";
  }, [appearance]);

  useEffect(() => {
    updateTheme();
  }, [updateTheme]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  return (
    <div className="flex size-full min-h-0 flex-col">
      <div className="join">
        <button
          className="join-item btn btn-sm btn-square btn-ghost"
          onClick={clearTerminal}
        >
          <BrushCleaning className="size-4" />
        </button>
      </div>

      <div
        ref={containerRef}
        className="flex min-h-0 flex-1 flex-col overflow-hidden p-1 outline-none"
        tabIndex={0}
      >
        <div
          ref={scrollRef}
          className="m-1 flex min-h-0 flex-1 flex-col overflow-y-auto"
        >
          {history.map((line) => (
            <div key={line.id} className="m-1 whitespace-pre-wrap">
              <span>{line.content.output}</span>
              <span className="text-error">{line.content.error}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Terminal;
