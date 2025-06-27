import React, { useState, useEffect, useContext } from 'react';

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
