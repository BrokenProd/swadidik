import { useEffect, useState } from "react";
import { Settings2, X, Moon, Sun } from "lucide-react";
import { useFileSystemStore } from "./fileSystemStore";
import { useWorkspaceUiStore } from "./workspaceUiStore";
import { getEditor } from "./editorRegistry";
import { loadTheme } from "#/shared/themes";
import type { WorkspaceFile } from "#/shared/files";
import {
  EditorAppearance,
  type AppearanceSettings,
} from "#/shared/editorSettings";

import loadFont from "#/fonts";
import { useTheme } from "#/shared/theme";

const updateTheme = async (
  file: WorkspaceFile,
  settings: AppearanceSettings,
) => {
  const { fontSize, editorTheme } = settings;
  const ext = await loadTheme(fontSize, editorTheme);

  const { view, themeCompartment } = getEditor(file.filePath);
  view.dispatch({
    effects: themeCompartment.reconfigure(ext),
  });
};

const EditorSettings = () => {
  const files = useFileSystemStore((state) => state.files);

  const [open, setOpen] = useState(false);
  const settings = useWorkspaceUiStore((state) => state.appearance);
  const setSettings = useWorkspaceUiStore((state) => state.updateAppearance);

  const isLightMode = settings.editorTheme === "TOKYO_NIGHT_DAY";

  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme(isLightMode ? "light" : "dark");
  }, [isLightMode, setTheme]);

  const handleChange = async (field: string, value: string | number) => {
    const theme = {
      ...settings,
      [field]: value,
    };

    EditorAppearance.save(theme);
    setSettings(theme);

    const { fontSize } = theme;
    await loadFont(fontSize);
    await Promise.all(
      Object.values(files).map((file) => updateTheme(file, theme)),
    );
  };

  return (
    <>
      <button
        className="btn btn-ghost btn-sm"
        type="button"
        aria-label="Pengaturan"
        title="Pengaturan"
        onClick={() => setOpen(true)}
      >
        <Settings2 />
        <span className="hidden sm:inline">Pengaturan</span>
      </button>

      <input
        type="checkbox"
        id="editor-settings-modal"
        className="modal-toggle"
        checked={open}
        onChange={(e) => setOpen(e.currentTarget.checked)}
      />
      <div className="modal modal-bottom sm:modal-middle">
        <div className="modal-box relative">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={() => setOpen(false)}
          >
            <X className="size-4" />
          </button>

          <h3 className="font-bold text-lg mb-4 label">Pengaturan</h3>

          <div className="flex flex-col gap-4">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Tema</span>
              </label>
              <fieldset className="fieldset">
                <label className="toggle toggle-xl text-base-content">
                  <input
                    type="checkbox"
                    checked={isLightMode}
                    onChange={(event) =>
                      handleChange(
                        "editorTheme",
                        event.currentTarget.checked
                          ? "TOKYO_NIGHT_DAY"
                          : "TOKYO_NIGHT",
                      )
                    }
                  />
                  <Moon />
                  <Sun />
                </label>
              </fieldset>
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Ukuran Fonta</span>
              </label>
              <input
                type="number"
                className="input w-full"
                min={12}
                max={32}
                value={settings.fontSize}
                onChange={(e) => {
                  const n = parseInt(e.currentTarget.value);
                  if (isNaN(n)) {
                    return;
                  }

                  const min = parseInt(e.currentTarget.min);
                  const max = parseInt(e.currentTarget.max);
                  if (n < min || n > max) {
                    return;
                  }

                  handleChange("fontSize", n);
                }}
              />
            </div>
          </div>
        </div>
        <label className="modal-backdrop" onClick={() => setOpen(false)}>
          Close
        </label>
      </div>
    </>
  );
};

export default EditorSettings;
