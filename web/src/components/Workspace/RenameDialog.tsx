import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";

interface RenameDialogProps {
  currentName: string;
  onRename: (newName: string) => void;
  onClose: () => void;
}

export const RenameDialog = ({
  currentName,
  onRename,
  onClose,
}: RenameDialogProps) => {
  const [newName, setNewName] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input and select filename without extension
    if (inputRef.current) {
      inputRef.current.focus();
      const lastDotIndex = currentName.lastIndexOf(".");
      if (lastDotIndex > 0) {
        inputRef.current.setSelectionRange(0, lastDotIndex);
      } else {
        inputRef.current.select();
      }
    }
  }, [currentName]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newName.trim() && newName !== currentName) {
      onRename(newName.trim());
    }
    onClose();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Rename File</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-control">
            <input
              ref={inputRef}
              type="text"
              className="input input-bordered w-full"
              value={newName}
              onChange={(e) => setNewName(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter new filename"
            />
          </div>
          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!newName.trim() || newName === currentName}
            >
              Rename
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};
