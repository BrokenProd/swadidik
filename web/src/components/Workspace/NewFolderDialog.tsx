import { useState, useRef, useEffect } from "react";
import type { FormEvent, KeyboardEvent } from "react";

interface NewFolderDialogProps {
  parentPath: string;
  onConfirm: (folderName: string) => void;
  onClose: () => void;
}

export const NewFolderDialog = ({
  parentPath,
  onConfirm,
  onClose,
}: NewFolderDialogProps) => {
  const [folderName, setFolderName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (folderName.trim()) {
      onConfirm(folderName.trim());
      onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Create New Folder</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Folder name</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              className="input input-bordered w-full"
              value={folderName}
              onChange={(e) => setFolderName(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., utils, components, tests"
              autoFocus
            />
            <label className="label">
              <span className="label-text-alt">In: {parentPath}</span>
            </label>
          </div>
          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!folderName.trim()}
            >
              Create
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};
