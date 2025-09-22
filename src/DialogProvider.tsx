import React, { createContext, useContext, useState, ReactNode } from "react";
import ReactDOM from "react-dom";

interface DialogEntry {
  key: number;
  render: () => React.ReactNode;
}

interface DialogContextType {
  openDialog: (render: () => React.ReactNode) => void;
  closeDialog: () => void;
  isOpen: boolean;
}

const DialogContext = createContext<DialogContextType | null>(null);

export const useDialog = () => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used within a DialogProvider");
  return ctx;
};

let _id = 0;
export const DialogProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [dialogStack, setDialogStack] = useState<DialogEntry[]>([]);
  const isOpen = dialogStack.length > 0;

  const openDialog = (render: () => React.ReactNode) =>
    setDialogStack((prev) => [...prev, { key: ++_id, render }]);

  const closeDialog = () => setDialogStack((prev) => prev.slice(0, -1));

  return (
    <DialogContext.Provider value={{ openDialog, closeDialog, isOpen }}>
      {children}

      {dialogStack.map((entry, idx) => {
        const isTop = idx === dialogStack.length - 1;

        return ReactDOM.createPortal(
          <div
            key={entry.key}
            style={{
              position: "fixed",
              inset: 0,
              // Only the topmost layer shows the dimmed backdrop
              background: isTop ? "rgba(0,0,0,0.45)" : "transparent",
              zIndex: 20000 + idx,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              // Only the topmost layer should receive pointer events
              pointerEvents: isTop ? "auto" : "none",
            }}
            // Only the topmost backdrop should close the dialog
            onClick={isTop ? closeDialog : undefined}
          >
            <div
              style={{
                minWidth: 340,
                background: "#23272f",
                borderRadius: 12,
                boxShadow: "0 8px 32px #000a",
                padding: "2em 2em 1.5em",
                position: "relative",
                // Keep underlying dialogs mounted but non-interactive & out of a11y
                // (visibility hidden still keeps it mounted)
              }}
              onClick={(e) => e.stopPropagation()}
              aria-hidden={!isTop}
            >
              {entry.render()}
            </div>
          </div>,
          document.body
        );
      })}
    </DialogContext.Provider>
  );
};
