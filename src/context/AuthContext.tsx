"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { toSessionUser, type BackendSessionUser, type ClientSession, type MenuItem, type SessionUser } from "@/lib/auth-types";

export type User = SessionUser;
export type { MenuItem };

/** Error thrown by `api()` with the backend's message and HTTP status. */
export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  permissions: string[];
  menu: MenuItem[];
  /** True for anyone the backend gives a dashboard menu (Admin, Manager, Salesman, custom staff roles). */
  isStaff: boolean;
  hasPermission: (permission: string) => boolean;
  isAuthenticated: boolean;
  loading: boolean;
  /** Accepts a phone number (default) or email (for staff/admin). */
  login: (identifier: string, password: string) => Promise<boolean>;
  register: (name: string, phoneNumber: string, password: string, confirmPassword: string) => Promise<boolean>;
  logout: () => Promise<void>;
  forgotPassword: (phoneNumber: string) => Promise<boolean>;
  verifyOtp: (phoneNumber: string, otp: string) => Promise<string | null>;
  resetPassword: (resetToken: string, newPassword: string, confirmPassword: string) => Promise<boolean>;
  refreshAuthSession: () => Promise<boolean>;
  /** PUT /api/auth/me. Changing phone/email needs currentPassword. Resolves true on success (errors are toasted). */
  updateProfile: (changes: ProfileChanges) => Promise<boolean>;
  /** POST /api/uploads/avatar: saved to the profile right away. */
  uploadAvatar: (file: File) => Promise<boolean>;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  /** Calls the backend through the same-origin proxy (`/api/v1/...`) with the access token. Throws ApiError. */
  api: <T = unknown>(path: string, options?: RequestInit) => Promise<ApiResponse<T>>;
}

export interface ProfileChanges {
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  email?: string;
  currentPassword?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const REFRESH_LOCK = "gsbd-auth-refresh";
/** Refresh this long before the 15-minute access token expires. */
const REFRESH_EARLY_MS = 60_000;

function tokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Runs `fn` while holding a lock shared by every tab, so only one tab rotates the refresh token at a time.
 * The backend revokes the whole session if an old refresh token is reused, which two racing tabs would do.
 */
function withRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return navigator.locks.request(REFRESH_LOCK, fn) as Promise<T>;
  }
  return fn();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Latest access token for request code; updated in the same tick as the state (no stale window after login).
  const accessTokenRef = useRef<string | null>(null);
  // Dedupes concurrent refreshes inside this tab (StrictMode double-mount, parallel 401 retries).
  const refreshInProgressRef = useRef<Promise<boolean> | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshAuthSessionRef = useRef<() => Promise<boolean>>(async () => false);

  const scheduleRefresh = useCallback((token: string | null) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = null;
    const exp = token ? tokenExpiry(token) : null;
    if (!exp) return;
    const delay = Math.max(exp - Date.now() - REFRESH_EARLY_MS, 5_000);
    refreshTimerRef.current = setTimeout(() => void refreshAuthSessionRef.current(), delay);
  }, []);

  const applySession = useCallback(
    (session: ClientSession | null) => {
      accessTokenRef.current = session?.accessToken ?? null;
      setAccessToken(session?.accessToken ?? null);
      setUser(session?.user ?? null);
      setPermissions(session?.permissions ?? []);
      setMenu(session?.menu ?? []);
      scheduleRefresh(session?.accessToken ?? null);
    },
    [scheduleRefresh]
  );

  // Silent session refresh from the HttpOnly refresh cookie
  const refreshAuthSession = useCallback(async (): Promise<boolean> => {
    if (refreshInProgressRef.current) return refreshInProgressRef.current;

    const refreshPromise = withRefreshLock(async () => {
      try {
        const res = await fetch("/api/auth/refresh", { method: "POST", headers: { "Content-Type": "application/json" } });
        const data = await res.json().catch(() => null);
        if (res.ok && data?.success && data.data) {
          applySession(data.data);
          return true;
        }
        // 502 = backend unreachable. Keep whatever session this tab has; anything else means logged out.
        if (res.status !== 502) applySession(null);
        return false;
      } catch {
        return false;
      }
    }).finally(() => {
      refreshInProgressRef.current = null;
    });

    refreshInProgressRef.current = refreshPromise;
    return refreshPromise;
  }, [applySession]);

  useEffect(() => {
    refreshAuthSessionRef.current = refreshAuthSession;
  }, [refreshAuthSession]);

  useEffect(() => {
    async function initAuth() {
      setLoading(true);
      await refreshAuthSession();
      setLoading(false);
    }
    initAuth();
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [refreshAuthSession]);

  // Authenticated fetch wrapper with automatic token refresh on 401
  const authenticatedFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      if (!accessTokenRef.current) {
        const refreshed = await refreshAuthSession();
        if (!refreshed) throw new ApiError("Please login to continue", 401);
      }

      const send = () => {
        const headers = new Headers(options.headers || {});
        if (accessTokenRef.current) headers.set("Authorization", `Bearer ${accessTokenRef.current}`);
        return fetch(url, { ...options, headers });
      };

      let response = await send();
      // Access token expired mid-session: refresh once and retry
      if (response.status === 401) {
        const refreshed = await refreshAuthSession();
        if (refreshed) response = await send();
      }
      return response;
    },
    [refreshAuthSession]
  );

  const api = useCallback(
    async <T,>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
      const headers = new Headers(options.headers || {});
      if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      const res = await authenticatedFetch(`/api/v1${path}`, { ...options, headers });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        throw new ApiError(body?.message || `Request failed (${res.status})`, res.status);
      }
      return body as ApiResponse<T>;
    },
    [authenticatedFetch]
  );

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user) return false;
      const role = (user.role || "").toLowerCase();
      if (role === "admin" || role === "superadmin" || permissions.includes("*") || permissions.includes("all")) {
        return true;
      }
      return permissions.includes(permission);
    },
    [user, permissions]
  );

  const startSession = async (url: string, payload: unknown, fallbackError: string, successMessage: string) => {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && data.data) {
        applySession(data.data);
        toast.success(data.message || successMessage);
        return true;
      }
      toast.error(data?.message || fallbackError);
      return false;
    } catch (err: unknown) {
      console.error(err);
      toast.error("Network error. Please check your connection.");
      return false;
    }
  };

  // Login accepts phone (default) or email (for admin / legacy accounts). The proxy forwards whichever we send.
  const login = (identifier: string, password: string) => {
    const trimmed = identifier.trim();
    const payload = trimmed.includes("@") ? { email: trimmed, password } : { phoneNumber: trimmed, password };
    return startSession("/api/auth/login", payload, "Invalid phone number / email or password.", "Welcome back! Login successful.");
  };

  const register = (name: string, phoneNumber: string, password: string, confirmPassword: string) =>
    startSession(
      "/api/auth/register",
      { fullName: name, phoneNumber: phoneNumber.trim(), password, confirmPassword },
      "Registration failed.",
      "Account created successfully!"
    );

  const postPublic = async (url: string, payload: unknown) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok && Boolean(data?.success), data };
  };

  const forgotPassword = async (phoneNumber: string): Promise<boolean> => {
    try {
      const { ok, data } = await postPublic("/api/auth/forgot-password", { phoneNumber: phoneNumber.trim() });
      if (ok) {
        toast.success(data.message || "A verification code has been sent to your phone.");
        return true;
      }
      toast.error(data?.message || "Failed to process forgot password request.");
      return false;
    } catch {
      toast.error("Network error. Please try again.");
      return false;
    }
  };

  const verifyOtp = async (phoneNumber: string, otp: string): Promise<string | null> => {
    try {
      const { ok, data } = await postPublic("/api/auth/verify-otp", { phoneNumber: phoneNumber.trim(), otp });
      if (ok && data.data?.resetToken) {
        toast.success(data.message || "Verification code verified successfully!");
        return data.data.resetToken;
      }
      toast.error(data?.message || "Invalid verification code.");
      return null;
    } catch {
      toast.error("Network error during OTP verification.");
      return null;
    }
  };

  const resetPassword = async (resetToken: string, newPassword: string, confirmPassword: string): Promise<boolean> => {
    try {
      const { ok, data } = await postPublic("/api/auth/reset-password", { resetToken, newPassword, confirmPassword });
      if (ok) {
        toast.success(data.message || "Password updated successfully!");
        return true;
      }
      toast.error(data?.message || "Failed to reset password.");
      return false;
    } catch {
      toast.error("Network error during password reset.");
      return false;
    }
  };

  const updateProfile = async (changes: ProfileChanges): Promise<boolean> => {
    try {
      const res = await api<{ user: BackendSessionUser; permissions: string[]; menu: MenuItem[] }>("/auth/me", {
        method: "PUT",
        body: JSON.stringify(changes),
      });
      setUser(toSessionUser(res.data.user));
      setPermissions(res.data.permissions ?? []);
      setMenu(res.data.menu ?? []);
      toast.success(res.message || "Profile updated successfully");
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update your profile.");
      return false;
    }
  };

  const uploadAvatar = async (file: File): Promise<boolean> => {
    const form = new FormData();
    form.append("images", file);
    try {
      const res = await api<{ avatarUrl: string }>("/uploads/avatar", { method: "POST", body: form });
      setUser((u) => (u ? { ...u, avatar: res.data.avatarUrl || null } : u));
      toast.success(res.message || "Profile picture updated");
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload the picture.");
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await withRefreshLock(() => fetch("/api/auth/logout", { method: "POST" }));
    } catch {
      // Ignore network errors; the local session is cleared regardless.
    } finally {
      applySession(null);
      toast.success("Logged out successfully.");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        permissions,
        menu,
        isStaff: menu.length > 0 || ["admin", "superadmin", "manager", "salesman"].includes((user?.role || "").toLowerCase()),
        hasPermission,
        isAuthenticated: Boolean(user),
        loading,
        login,
        register,
        logout,
        forgotPassword,
        verifyOtp,
        resetPassword,
        refreshAuthSession,
        updateProfile,
        uploadAvatar,
        authenticatedFetch,
        api,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
