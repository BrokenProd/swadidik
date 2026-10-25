import { useEffect, useState } from "react";
import { apiFetch } from "./api";
import type { CourseProgress } from "./course";

export const useCourseProgress = (courseId?: string) => {
  const [completedTrackIDs, setCompletedTrackIDs] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    if (!courseId) return;

    let cancelled = false;

    const loadProgress = async () => {
      try {
        const response = await apiFetch("/courses/progress");
        if (!response.ok) return;

        const progress = (await response.json()) as CourseProgress[];
        if (!cancelled) {
          setCompletedTrackIDs(
            new Set(
              progress
                .filter((item) => item.is_done)
                .map((item) => item.track_id),
            ),
          );
        }
      } catch {
        // Progress is optional; callers remain usable when it cannot be loaded.
      }
    };

    void loadProgress();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  return { completedTrackIDs, setCompletedTrackIDs };
};
