import React from "react";
import {
  Label,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/16/solid";
import { CheckIcon } from "@heroicons/react/20/solid";
import DialogHeader from "../DialogHeader";

interface Props {
  backups: string[];
  onCancel: () => void;
  onConfirm: (b: string) => void;
  open: boolean;
  title?: string;
}

const RestoreDialog: React.FC<Props> = ({
  backups,
  onCancel,
  onConfirm,
  open,
}) => {
  if (!open) return null;

  const [selectedBackup, setSelectedBackup] = React.useState<string | null>(
    null
  );

  const handleSelect = (backup: string) => {
    setSelectedBackup(backup);
  };

  const sorted = React.useMemo(
    () => [...backups].sort((a, b) => b.localeCompare(a)),
    [backups]
  );

  function formatLabel(filename: string): string {
    const match = filename?.match(
      /(\d{4}-\d{2}-\d{2}T\d{2}[-:]\d{2}[-:]\d{2})/
    );
    if (!match) return filename ?? "";
    try {
      const normalized = match[0].replace(
        /T(\d{2})[-:](\d{2})[-:](\d{2})/,
        "T$1:$2:$3"
      );
      const parsed = new Date(normalized);
      return isNaN(parsed.getTime()) ? normalized : parsed.toLocaleString();
    } catch {
      return match[0];
    }
  }

  return (
    <div className="text-white w-96">
      <DialogHeader
        title="Select Backup to Restore"
        tabs={[]}
        activeTab=""
        setActiveTab={() => {}}
        onClose={onCancel}
      />

      <Listbox
        value={selectedBackup ?? undefined}
        onChange={(val: string) => {
          console.log("Selected backup:", val);
          handleSelect(val);
        }}
      >
        <Label className="block text-sm font-medium text-white">
          Available Backups
        </Label>

        <div className="relative mt-2">
          <ListboxButton className="grid w-full cursor-default grid-cols-1 rounded-md bg-white/5 py-1.5 pr-2 pl-3 text-left text-white outline-1 -outline-offset-1 outline-white/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-500 sm:text-sm">
            <span className="col-start-1 row-start-1 truncate pr-6">
              {selectedBackup
                ? formatLabel(selectedBackup)
                : "Choose a backup…"}
            </span>
            <ChevronUpDownIcon
              aria-hidden="true"
              className="col-start-1 row-start-1 size-5 self-center justify-self-end text-gray-400 sm:size-4"
            />
          </ListboxButton>

          <ListboxOptions
            transition
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-800 py-1 text-base shadow-lg outline-1 -outline-offset-1 outline-white/10 sm:text-sm"
          >
            {sorted.map((b) => (
              <ListboxOption
                key={b}
                value={b}
                className="group relative cursor-default py-2 pr-9 pl-3 text-white select-none data-[focus]:bg-indigo-500 data-[focus]:outline-none"
              >
                <span className="block truncate font-normal group-data-[selected]:font-semibold">
                  {formatLabel(b)}
                </span>
                <span className="absolute inset-y-0 right-0 hidden items-center pr-4 text-indigo-400 group-data-[selected]:flex group-data-[focus]:text-white">
                  <CheckIcon aria-hidden="true" className="size-5" />
                </span>
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      </Listbox>

      <div className="flex justify-end mt-4 gap-2">
        <button
          onClick={onCancel}
          className="bg-gray-700 text-white px-3 py-1 rounded-md"
        >
          Cancel
        </button>
        <button
          onClick={() => selectedBackup && onConfirm(selectedBackup)}
          className="bg-indigo-600 text-white px-3 py-1 rounded-md font-semibold"
        >
          Restore
        </button>
      </div>
    </div>
  );
};
export default RestoreDialog;
