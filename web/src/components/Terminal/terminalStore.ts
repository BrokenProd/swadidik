import { create } from "zustand";

export interface TerminalLine {
  id: string;
  content: { output: string; error?: string };
  type: "output";
}

interface TerminalState {
  history: TerminalLine[];
  output: (text: string, error?: string) => void;
  clear: () => void;
}

export const useTerminalStore = create<TerminalState>((set) => ({
  history: [],
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

  clear: () => set({ history: [] }),
}));
