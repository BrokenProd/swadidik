import { Maximize2 } from "lucide-react";
import { Terminal } from "#/components/Terminal";

interface TerminalPanelProps {
  onMaximize?: () => void;
}

const TerminalPanel = ({ onMaximize }: TerminalPanelProps) => (
  <div className="flex h-full flex-col bg-base-100">
    <div className="flex items-center justify-between border-b border-base-300 px-4 py-2">
      <span className="text-sm font-medium">Terminal</span>
      {onMaximize && (
        <button
          className="p-2 hover:bg-base-200 transition-colors"
          onClick={onMaximize}
          aria-label="Maximize terminal"
        >
          <Maximize2 className="size-4" />
        </button>
      )}
    </div>
    <div className="min-h-0 flex-1 overflow-hidden">
      <Terminal />
    </div>
  </div>
);

export default TerminalPanel;
