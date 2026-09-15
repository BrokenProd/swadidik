import { useState, useRef, useEffect } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { useFileSystemStore } from "./fileSystemStore";

interface NewFileDialogProps {
  parentPath: string;
  onConfirm: (fileName: string) => void;
  onClose: () => void;
}

export const NewFileDialog = ({ parentPath, onConfirm, onClose }: NewFileDialogProps) => {
  const filenameRef = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);
  const files = useFileSystemStore(state => state.files);
  const [filenameInvalid, setFilenameInvalid] = useState("")

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = () => {
    if (filenameRef.current.trim()) {
      onConfirm(filenameRef.current.trim());
      onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const validateFilename = (e: ChangeEvent<HTMLInputElement>) => {
    const filename = e.currentTarget.value.trim();
    const filepath = `${parentPath}/${filename}`;
    if (filename === "") {
      setFilenameInvalid("File name should not empty");
    } else if (filename.startsWith('.')) {
      setFilenameInvalid("Name can't be start with \".\"");
    } else if (filename.endsWith('/')) {
      setFilenameInvalid(`File name should not ends with "/"`)
    } else if (/\s/g.test(filename)) {
      setFilenameInvalid("File name should not contains whitespace")
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(filename)) {
      setFilenameInvalid(`Allowed special characters are "_", "-", "."`)
    }

    if (files[filepath]) {
      setFilenameInvalid("File with the same name already exist");
    } else {
      setFilenameInvalid("");
    }

    filenameRef.current = filename;
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Create New File</h3>
        <div className="form-control">
          <label className="label">
            <span className="label-text">File name</span>
          </label>
          <input
            ref={inputRef}
            type="text"
            className="input input-bordered w-full"
            defaultValue={""}
            onChange={validateFilename}
            onKeyDown={handleKeyDown}
            placeholder="e.g., main.py, utils.js, config.json"
            autoFocus
          />
          <div className="flex flex-col">
            <label className="label mt-2">
              <span className="label-text-alt">In: {parentPath}</span>
            </label>
            {filenameInvalid && <label className="label mt-2">
              <span className="text-error">{filenameInvalid}</span>
            </label>}
          </div>
        </div>
        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={filenameInvalid.length > 0}
            onClick={handleSubmit}
          >
            Create
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};
