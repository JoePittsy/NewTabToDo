import React, { createContext, useContext, useState, ReactNode } from 'react';
import ReactDOM from 'react-dom';

interface DialogContextType {
  openDialog: (content: React.ReactNode) => void;
  closeDialog: () => void;
  isOpen: boolean;
}

const DialogContext = createContext<DialogContextType | null>(null);

export const useDialog = () => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within a DialogProvider');
  return ctx;
};

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dialogContent, setDialogContent] = useState<React.ReactNode>(null);
  const isOpen = dialogContent !== null;

  const openDialog = (content: React.ReactNode) => setDialogContent(content);
  const closeDialog = () => setDialogContent(null);

  return (
    <DialogContext.Provider value={{ openDialog, closeDialog, isOpen }}>
      {children}
      {isOpen && ReactDOM.createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.45)',
          zIndex: 20000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
          onClick={closeDialog}
        >
          <div style={{ minWidth: 340, background: '#23272f', borderRadius: 12, boxShadow: '0 8px 32px #000a', padding: '2em 2em 1.5em', position: 'relative' }} onClick={e => e.stopPropagation()}>
            {dialogContent}
          </div>
        </div>,
        document.body
      )}
    </DialogContext.Provider>
  );
};
