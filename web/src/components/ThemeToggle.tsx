import { Moon, Sun } from "lucide-react";
import { useTheme } from "#/shared/theme";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === "light" ? "dark" : "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="fixed bottom-4 right-4 z-50 grid size-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-[#23b79f]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
      aria-label={`Gunakan tema ${nextTheme === "dark" ? "gelap" : "terang"}`}
      title={`Gunakan tema ${nextTheme === "dark" ? "gelap" : "terang"}`}
    >
      {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
    </button>
  );
};

export default ThemeToggle;
