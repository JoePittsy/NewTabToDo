import React from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/16/solid";
import { CheckIcon } from "@heroicons/react/20/solid";

interface Props {
  backups: string[];
  selected: string | null;
  onSelect: (b: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
}

const DropboxRestoreDialog: React.FC<Props> = ({
  backups,
  selected,
  onSelect,
  onCancel,
  onConfirm,
  open,
}) => {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#23272f",
          borderRadius: 12,
          padding: 20,
          width: 360,
          color: "#f3f6fa",
        }}
      >
        <h3 style={{ marginBottom: 12, fontSize: "1.1em", fontWeight: 600 }}>
          Select Backup to Restore
        </h3>
        <Listbox value={selected ?? undefined} onChange={onSelect}>
          <div className="relative mt-2">
            <ListboxButton className="w-full flex justify-between rounded-md border px-3 py-2 text-left bg-[#2f3542] text-gray-100">
              <span>{selected}</span>
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
            </ListboxButton>
            <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#2f3542] shadow-lg text-gray-100">
              {backups.map((b) => (
                <ListboxOption
                  key={b}
                  value={b}
                  className="cursor-pointer py-2 px-3 hover:bg-indigo-600 hover:text-white"
                >
                  {({ selected }) => (
                    <>
                      <span>{b}</span>
                      {selected && (
                        <CheckIcon className="h-5 w-5 text-indigo-400" />
                      )}
                    </>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </div>
        </Listbox>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 16,
            gap: 10,
          }}
        >
          <button
            onClick={onCancel}
            style={{
              background: "#2f3542",
              color: "#f3f6fa",
              border: "1px solid #555",
              padding: "0.4em 1em",
              borderRadius: 6,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              background: "#3b82f6",
              color: "#fff",
              padding: "0.4em 1em",
              borderRadius: 6,
              fontWeight: 600,
            }}
          >
            Restore
          </button>
        </div>
      </div>
    </div>
  );
};

export default DropboxRestoreDialog;
