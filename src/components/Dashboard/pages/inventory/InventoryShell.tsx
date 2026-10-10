"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { INVENTORY_TABS, InventoryTabs } from "./shared";

/**
 * Shared inventory sub-navigation. Shown above every inventory sub-page.
 * Tabs the current staff role lacks permission for are hidden.
 */
export default function InventoryShell({ children }: { children: React.ReactNode }) {
  const { hasPermission } = useAuth();
  const tabs = useMemo(
    () => INVENTORY_TABS.filter((t) => !t.anyPermission || t.anyPermission.some(hasPermission)),
    [hasPermission]
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <InventoryTabs visibleTabs={tabs} />
      {children}
    </div>
  );
}
