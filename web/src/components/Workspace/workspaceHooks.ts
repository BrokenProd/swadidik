import { useEffect } from "react";
import { type WorkspaceFile } from "#/shared/files";

import loadFont from "#/fonts";

export const useTabNavigation = (
  tabs: WorkspaceFile[],
  selectedTab: string,
) => {
  const currentIndex = tabs.findIndex((t) => t.filePath === selectedTab);
  const disableLeft = currentIndex <= 0 || tabs.length < 2;
  const disableRight = currentIndex >= tabs.length - 1 || tabs.length < 2;

  const navigate = (direction: "left" | "right") => {
    const newIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex >= 0 && newIndex < tabs.length) {
      return tabs[newIndex].filePath;
    }
    return null;
  };

  return { navigate, disableLeft, disableRight };
};

export const useFontLoader = (fontFamily: string, fontSize: number) => {
  useEffect(() => {
    loadFont(fontFamily, fontSize);
  }, [fontFamily, fontSize]);
};
