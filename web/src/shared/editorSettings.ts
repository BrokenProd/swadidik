export const THEMES = {
  TOKYO_NIGHT: { name: "Tokyo Night" },
  TOKYO_NIGHT_DAY: { name: "Tokyo Night Day" },
} as const;

type ThemeKey = keyof typeof THEMES;
type FontFamily = "JetBrains Mono" | "Fira Code";

export interface AppearanceSettings {
  fontFamily: FontFamily;
  fontSize: number;
  editorTheme: ThemeKey;
}

export class EditorAppearance {
  static STORAGE_KEY = "EDITOR_SETTINGS";

  static load(): AppearanceSettings {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    const parsed: Partial<AppearanceSettings> = saved ? JSON.parse(saved) : {};

    return {
      fontFamily: parsed.fontFamily ?? "JetBrains Mono",
      fontSize: parsed.fontSize ?? 16,
      editorTheme: parsed.editorTheme ?? "TOKYO_NIGHT",
    };
  }

  static save(settings: Partial<AppearanceSettings>): AppearanceSettings {
    const current = this.load();
    const updated: AppearanceSettings = {
      ...current,
      ...settings,
      fontSize: settings.fontSize ?? current.fontSize,
      fontFamily: settings.fontFamily ?? current.fontFamily,
      editorTheme: settings.editorTheme ?? current.editorTheme,
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    return updated;
  }

  static getThemeName(themeKey: ThemeKey): string {
    return THEMES[themeKey]?.name ?? "Unknown";
  }
}
