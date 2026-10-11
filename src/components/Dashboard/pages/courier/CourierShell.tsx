"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { COURIER_TABS, CourierTabs } from "./shared";

/** Shared sub-navigation shown above every courier sub-page. */
export default function CourierShell({ children }: { children: React.ReactNode }) {
  const { hasPermission } = useAuth();
  const tabs = useMemo(
    () => COURIER_TABS.filter((t) => !t.anyPermission || t.anyPermission.some(hasPermission)),
    [hasPermission]
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <CourierTabs visibleTabs={tabs} />
      {children}
    </div>
  );
}
