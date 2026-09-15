import { create } from "zustand";

export interface TerminalLine {
  id: string;
  content: { output: string; error?: string };
  type: "echo" | "output" | "raw";
}

export interface TerminalSettings {
  prompt: string;
  allowScroll: boolean;
}

interface TerminalState {
  history: TerminalLine[];
  settings: TerminalSettings;
  output: (text: string, error?: string) => void;
  echo: (text: string) => void;
  raw: (text: string) => void;
  clear: () => void;
  setSettings: (settings: Partial<TerminalSettings>) => void;
}

const DEFAULT_SETTINGS: TerminalSettings = {
  prompt: "$ ",
  allowScroll: true,
};

export const useTerminalStore = create<TerminalState>((set, get) => ({
  history: [],
  settings: DEFAULT_SETTINGS,
  raw: (text: string) => {
    const { history } = get();

    const idx = history.length - 1;
    const item =
      idx >= 0
        ? {
            ...history[idx],
            content: {
              output: history[idx].content.output + text,
              error: history[idx].content.error,
            },
          }
        : {
            id: crypto.randomUUID(),
            content: { output: text },
            type: "raw" as const,
          };

    set({ history: [...history.slice(0, -1), item] });
  },

  output: (text: string, error?: string) => {
    set((state) => ({
      history: [
        ...state.history,
        {
          id: crypto.randomUUID(),
          content: { output: text, error },
          type: "output",
        },
      ],
    }));
  },

  echo: (text: string) => {
    set((state) => ({
      history: [
        ...state.history,
        {
          id: crypto.randomUUID(),
          content: { output: text },
          type: "echo",
        },
      ],
    }));
  },

  clear: () => set({ history: [] }),

  setSettings: (settings: Partial<TerminalSettings>) => {
    set((state) => ({
      settings: { ...state.settings, ...settings },
    }));
  },
}));
