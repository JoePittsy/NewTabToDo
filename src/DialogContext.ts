import { createContext } from "react";

export interface DialogContextType {
    openDialog: (render: () => React.ReactNode) => void;
    closeDialog: () => void;
    isOpen: boolean;
}

export const DialogContext = createContext<DialogContextType | null>(null);
