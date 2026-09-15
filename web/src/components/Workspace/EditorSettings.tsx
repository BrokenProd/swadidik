import { useMemo, useState } from "react";
import { Settings2, X, Moon, Sun } from "lucide-react";
import { useWorkspaceStore } from "./store";
import { loadTheme } from "#/shared/themes";
import type { WorkspaceFile } from "#/shared/files";
import {
  EditorAppearance,
  type AppearanceSettings,
} from "#/shared/editorSettings";

import loadFont from "#/fonts";

const updateTheme = async (
  file: WorkspaceFile,
  settings: AppearanceSettings,
) => {
  const { fontSize, fontFamily, editorTheme } = settings;
  const ext = await loadTheme(fontFamily, fontSize, editorTheme);

  const view = file.view;
  view.dispatch({
    effects: file.themeCompartment.reconfigure(ext),
  });
};

const EditorSettings = () => {
  const selectedTab = useWorkspaceStore((state) => state.selectedTab);
  const files = useWorkspaceStore((state) => state.files);

  const [open, setOpen] = useState(false);
  const settings = useWorkspaceStore(state => state.appearance);
  const setSettings = useWorkspaceStore(state => state.updateAppearance);

  const fonts = useMemo(() => ["JetBrains Mono", "Fira Code"], []);

  const handleChange = async (field: string, value: string | number) => {
    const theme = {
      ...settings,
      [field]: value,
    };

    EditorAppearance.save(theme);
    setSettings(theme);

    const file = files.find((f) => f.filePath === selectedTab);
    if (file) {
      const { fontSize, fontFamily } = theme;
      await loadFont(fontFamily, fontSize);
      updateTheme(file, theme);
    }
  };

  const change = (state: boolean) => {
    setOpen(state);

    if (!state) {
      files
        .filter((f) => f.filePath !== selectedTab)
        .forEach((f) => updateTheme(f, settings));
    }
  };

  return (
    <>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => setOpen(true)}
      >
        <Settings2 />
        <span className="inline">Settings</span>
      </button >

      <input
        type="checkbox"
        id="editor-settings-modal"
        className="modal-toggle"
        checked={open}
        onChange={(e) => change(e.currentTarget.checked)}
      />
      <div className="modal modal-bottom sm:modal-middle">
        <div className="modal-box relative">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={() => change(false)}
          >
            <X className="size-4" />
          </button>

          <h3 className="font-bold text-lg mb-4 label">Editor Settings</h3>

          <div className="flex flex-col gap-4">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Theme</span>
              </label>
              <fieldset className="fieldset">
                <label className="toggle toggle-xl text-base-content">
                  <input type="checkbox"
                    defaultChecked={settings.editorTheme === "TOKYO_NIGHT_DAY"}
                    onClick={() => {
                      const editorTheme = settings.editorTheme === "TOKYO_NIGHT"
                        ? "TOKYO_NIGHT_DAY"
                        : "TOKYO_NIGHT";
                      handleChange("editorTheme", editorTheme);
                    }}
                  />
                  <Moon />
                  <Sun />
                </label>
              </fieldset>
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Font</span>
              </label>
              <select
                className="select w-full"
                value={settings.fontFamily}
                onChange={(e) =>
                  handleChange("fontFamily", e.currentTarget.value)
                }
              >
                {fonts.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Font Size</span>
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
        <label className="modal-backdrop" onClick={() => change(false)}>
          Close
        </label>
      </div>
    </>
  );
};

export default EditorSettings;
