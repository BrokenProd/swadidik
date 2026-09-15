import { useSyncExternalStore } from "react";

const DEFAULT_QUERY = "(min-width: 768px)";

export const useDesktopLayout = (query = DEFAULT_QUERY) => {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") {
        return () => {};
      }

      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener("change", onStoreChange);

      return () => {
        mediaQuery.removeEventListener("change", onStoreChange);
      };
    },
    () => {
      if (typeof window === "undefined") {
        return false;
      }

      return window.matchMedia(query).matches;
    },
    () => false,
  );
};
