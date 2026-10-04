"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type Ctx = {
  open: boolean;
  toggle: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
};

const CategorySidebarContext = createContext<Ctx>({
  open: false,
  toggle: () => {},
  openSidebar: () => {},
  closeSidebar: () => {},
});

// Shared toggle state so the Header button, the sidebar itself, and the Hero
// (which hides its promo cards while the sidebar is open) stay in sync.
export function CategorySidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo<Ctx>(
    () => ({
      open,
      toggle: () => setOpen((v) => !v),
      openSidebar: () => setOpen(true),
      closeSidebar: () => setOpen(false),
    }),
    [open]
  );
  return <CategorySidebarContext.Provider value={value}>{children}</CategorySidebarContext.Provider>;
}

export function useCategorySidebar() {
  return useContext(CategorySidebarContext);
}
