import React, { useState, useEffect, useContext, ReactNode } from 'react';
import ReactDOM from 'react-dom';

interface MenuContextType {
  openMenu: (anchor: HTMLElement) => void;
  closeMenu: () => void;
  anchorEl: HTMLElement | null;
  open: boolean;
}

const MenuContext = React.createContext<MenuContextType | null>(null);

export const useMenuContext = () => {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('useMenuContext must be used within a MenuProvider');
  return ctx;
};

export const MenuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = !!anchorEl;
  const openMenu = (anchor: HTMLElement) => setAnchorEl(anchor);
  const closeMenu = () => setAnchorEl(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      const menuEl = document.getElementById('global-project-menu');
      if (
        menuEl && !menuEl.contains(e.target as Node) &&
        anchorEl && !anchorEl.contains(e.target as Node)
      ) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open, anchorEl]);

  return (
    <MenuContext.Provider value={{ openMenu, closeMenu, anchorEl, open }}>
      {children}
    </MenuContext.Provider>
  );
};

export const ContextMenu: React.FC<{ children: ReactNode }> = ({ children }) => {
  const ctx = useMenuContext();
  if (!ctx.open || !ctx.anchorEl) return null;
  const rect = ctx.anchorEl.getBoundingClientRect();
  const style: React.CSSProperties = {
    position: 'fixed',
    top: rect.bottom + 8,
    left: rect.left,
    zIndex: 9999,
    minWidth: 220,
    background: '#23272f',
    border: '1px solid #2d313a',
    borderRadius: 8,
    boxShadow: '0 4px 24px #0006',
    padding: '0.7em 0',
    color: '#f3f6fa',
  };
  return ReactDOM.createPortal(
    <div id="global-project-menu" style={style} tabIndex={-1}>
      {children}
    </div>,
    document.body
  );
};
