"use client";

import { useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { MODULES, levelFor, type AccessLevel, type ModuleKey } from "./permissions";

/**
 * Dashboard access derived from the backend session: the `menu` decides which pages a user may open,
 * `permissions` decide which actions they may take. The backend still enforces every API call.
 */
export function useDashboardAccess() {
  const { loading, user, menu, permissions, isStaff, hasPermission } = useAuth();

  const menuKeys = useMemo(() => new Set(menu.map((m) => m.key)), [menu]);
  const permissionSet = useMemo(() => new Set(permissions), [permissions]);

  const levelOf = useCallback(
    (key: ModuleKey): AccessLevel => {
      const mod = MODULES.find((m) => m.key === key);
      return mod && isStaff ? levelFor(mod, menuKeys, permissionSet, user?.role) : "none";
    },
    [isStaff, menuKeys, permissionSet, user?.role]
  );

  return {
    ready: !loading,
    isStaff,
    roleName: user?.roleName ?? "",
    levelOf,
    can: hasPermission,
  };
}

/** Access level of the current user for one dashboard module. */
export function usePermission(key: ModuleKey) {
  const { levelOf, can } = useDashboardAccess();
  const level = levelOf(key);
  return { level, canView: level !== "none", canEdit: level === "edit", can };
}
