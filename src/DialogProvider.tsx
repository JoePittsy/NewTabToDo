import React, { useState, ReactNode } from "react";
import { DialogContext } from "./DialogContext";
import ReactDOM from "react-dom";

interface DialogEntry {
    key: number;
    render: () => React.ReactNode;
}

let _id = 0;
export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [dialogStack, setDialogStack] = useState<DialogEntry[]>([]);
    const isOpen = dialogStack.length > 0;

    const openDialog = (render: () => React.ReactNode) => setDialogStack((prev) => [...prev, { key: ++_id, render }]);

    const closeDialog = () => setDialogStack((prev) => prev.slice(0, -1));

    return (
        <DialogContext.Provider value={{ openDialog, closeDialog, isOpen }}>
            {children}

            {dialogStack.map((entry, idx) => {
                const isTop = idx === dialogStack.length - 1;

                return ReactDOM.createPortal(
                    <div
                        key={entry.key}
                        className="fixed inset-0 flex items-center justify-center"
                        style={{
                            // Only the topmost layer shows the dimmed backdrop
                            background: isTop ? "rgba(0,0,0,0.45)" : "transparent",
                            zIndex: 20000 + idx,
                            // Only the topmost layer should receive pointer events
                            pointerEvents: isTop ? "auto" : "none",
                        }}
                        // Only the topmost backdrop should close the dialog
                        onClick={isTop ? closeDialog : undefined}
                    >
                        <div
                            className="relative min-w-[340px] rounded-xl bg-[#23272f] shadow-[0_8px_32px_#000a] p-8 pt-8 pb-6"
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
