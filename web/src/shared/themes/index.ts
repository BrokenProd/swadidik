import loadFont from "#/fonts";
import type { Extension } from "@codemirror/state";
import type { CreateThemeOptions, Settings } from "./themes";

type ThemeInitializer = (options?: Partial<CreateThemeOptions>) => Extension;

export const getEditorTheme = async (
  theme: string,
): Promise<ThemeInitializer> => {
  switch (theme) {
    case "TOKYO_NIGHT": {
      const TokyoNight = await import("./tokyo-night");
      return TokyoNight.default;
    }
    case "TOKYO_NIGHT_DAY": {
      const TokyoNightDay = await import("./tokyo-night-day");

      return TokyoNightDay.default;
    }
    default:
      throw new Error(`Not a valid member of theme: "${theme}"`);
  }
};

export const getEditorThemeSettings = async (
  theme: string,
): Promise<Settings> => {
  switch (theme) {
    case "TOKYO_NIGHT": {
      const TokyoNight = await import("./tokyo-night");
      return TokyoNight.defaultSettingsTokyoNight;
    }
    case "TOKYO_NIGHT_DAY": {
      const TokyoNightDay = await import("./tokyo-night-day");

      return TokyoNightDay.defaultSettingsTokyoNightDay;
    }
    default:
      throw new Error(`Not a valid member of theme: "${theme}"`);
  }
};

export const loadTheme = async (
  fontSize: number,
  editorTheme: string,
) => {
  const themeOptions = {
    settings: {
      fontSize: `${fontSize}px`,
      fontFamily: "JetBrains Mono",
    },
  };

  await loadFont(fontSize);

  const themeInit = await getEditorTheme(editorTheme);
  return themeInit(themeOptions);
};
