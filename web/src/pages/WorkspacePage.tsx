import Workspace from "#/components/Workspace";
import { useLocation } from "react-router";

type Track = {
  uuid: string;
  order: number;
  title: string;
};

function WorkspacePage() {
  const { state } = useLocation();
  const listTrack = (state as { tracks?: Track[] } | null)?.tracks ?? [];

  const searchParams = new URLSearchParams(window.location.search);
  const courseId = searchParams.get("course_id");
  const uuid = searchParams.get("uuid") ?? listTrack[0]?.uuid ?? "";

  if (!courseId) {
    return (
      <div className="flex h-screen items-center justify-center">
        A workspace ID is required.
      </div>
    );
  }

  return (
    <div className="w-screen h-screen">
      <Workspace uuid={uuid} courseId={courseId} editable={false} />
    </div>
  );
}

export default WorkspacePage;
