"use client";

import { useCategorySidebar } from "@/context/CategorySidebarContext";

// Wraps the storefront <main> so the sidebar can push content to the right on desktop
// while leaving the mobile drawer unchanged (that layer handles its own backdrop).
export default function StoreMain({ children }: { children: React.ReactNode }) {
  const { open } = useCategorySidebar();
  return (
    <main
      className={`flex-1 pb-4 transition-[padding] duration-300 ease-out ${
        open ? "lg:pl-72 xl:pl-80" : "lg:pl-0"
      }`}
    >
      {children}
    </main>
  );
}
