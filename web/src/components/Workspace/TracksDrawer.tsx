import { CircleX } from "lucide-react";
import type { Track } from "#/shared/course";

interface TracksDrawerProps {
  tracks: Track[];
  activeTrackUuid: string;
  completedTrackIDs: Set<string>;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (uuid: string) => void;
}

const TracksDrawer = ({
  tracks,
  activeTrackUuid,
  completedTrackIDs,
  isOpen,
  onClose,
  onSelect,
}: TracksDrawerProps) => (
  <div
    className={`absolute inset-x-2 bottom-2 top-[52px] z-30 transition-[visibility] duration-300 ${
      isOpen ? "visible" : "invisible delay-300"
    }`}
    aria-hidden={!isOpen}
  >
    <button
      className={`absolute inset-0 cursor-default bg-neutral/20 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0"
      }`}
      type="button"
      tabIndex={isOpen ? 0 : -1}
      aria-label="Close tracks drawer"
      onClick={onClose}
    />
    <aside
      id="workspace-tracks-drawer"
      className={`absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col border border-base-300 bg-base-100 shadow-xl transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      aria-label="Tracks"
    >
      <div className="flex items-center justify-between border-b border-base-300 px-4 py-3">
        <span className="font-semibold">Daftar Materi</span>
        <button
          className="btn btn-ghost btn-sm btn-square"
          type="button"
          tabIndex={isOpen ? 0 : -1}
          aria-label="Close tracks drawer"
          onClick={onClose}
        >
          <CircleX className="size-5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {tracks.length === 0 ? (
          <p className="px-3 py-2 text-sm text-base-content/60">
            Tidak ada materi.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {tracks.map((track) => {
              const isActive = track.uuid === activeTrackUuid;
              const isComplete = completedTrackIDs.has(track.uuid);

              return (
                <button
                  key={track.uuid}
                  type="button"
                  tabIndex={isOpen ? 0 : -1}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex w-full items-center gap-2 rounded-btn px-3 py-2 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-primary text-primary-content"
                      : "hover:bg-base-200"
                  }`}
                  onClick={() => onSelect(track.uuid)}
                >
                  <input
                    className="checkbox checkbox-sm pointer-events-none"
                    type="checkbox"
                    checked={isComplete}
                    readOnly
                    tabIndex={-1}
                    aria-label={`${track.title} selesai`}
                  />
                  <span className="font-medium">{track.order}.</span>
                  <span className="truncate">{track.title}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  </div>
);

export default TracksDrawer;
