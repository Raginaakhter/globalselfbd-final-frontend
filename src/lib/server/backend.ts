// Server-side only: imported by Next.js route handlers, never by client components.
import { NextResponse } from "next/server";
import { REFRESH_TOKEN_COOKIE_NAME } from "@/lib/cookies";
import { toSessionUser, type BackendSessionUser, type MenuItem } from "@/lib/auth-types";

/** Express API base URL. Server-side only; the browser always talks to Next.js routes. */
export const BACKEND_URL = (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000").replace(/\/+$/, "");

export interface BackendResult<T = unknown> {
  status: number;
  body: { success: boolean; message?: string; data?: T; [key: string]: unknown };
}

/** Calls the backend and always resolves with a JSON body (network failures become 502). */
// 25s cap — longer than Mocean's slowest realistic response, shorter than browser idle timeouts.
const BACKEND_TIMEOUT_MS = 25_000;

export async function callBackend<T = unknown>(path: string, init: RequestInit = {}): Promise<BackendResult<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, { ...init, cache: "no-store", signal: controller.signal });
    const text = await res.text();
    let body: BackendResult<T>["body"];
    try {
      body = text ? JSON.parse(text) : { success: res.ok };
    } catch {
      body = { success: false, message: `Unexpected response from server (${res.status})` };
    }
    return { status: res.status, body };
  } catch (err) {
    const aborted = (err as { name?: string })?.name === "AbortError";
    return {
      status: aborted ? 504 : 502,
      body: {
        success: false,
        message: aborted
          ? "The server took too long to respond. Please try again."
          : "Cannot reach the server. Please try again shortly.",
      },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export const jsonPost = (body: unknown, headers: Record<string, string> = {}): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json", ...headers },
  body: JSON.stringify(body),
});

/* ---------- Session shaping ---------- */

export interface BackendSession {
  user: BackendSessionUser;
  permissions: string[];
  menu: MenuItem[];
  accessToken?: string;
  refreshToken?: string;
}

/** What the browser receives: never the refresh token (that lives only in the HttpOnly cookie). */
export function clientSession(s: BackendSession, accessToken: string) {
  return {
    user: toSessionUser(s.user),
    permissions: s.permissions ?? [],
    menu: s.menu ?? [],
    accessToken,
  };
}

/* ---------- Refresh cookie ---------- */

const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

export function setRefreshCookie(res: NextResponse, token: string) {
  res.cookies.set({
    name: REFRESH_TOKEN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_MAX_AGE,
  });
  return res;
}

export function clearRefreshCookie(res: NextResponse) {
  res.cookies.set({ name: REFRESH_TOKEN_COOKIE_NAME, value: "", httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}

/* ---------- Single-flight token refresh ---------- */

// The backend rotates refresh tokens and revokes the whole session if an old token is reused.
// Two concurrent refreshes with the same cookie (two tabs, StrictMode, retries) would log the user out,
// so concurrent and back-to-back refreshes for one token share a single backend call.
type RefreshOutcome = BackendResult<{ accessToken: string; refreshToken: string }>;
const inflight = new Map<string, { promise: Promise<RefreshOutcome>; expires: number }>();
const REUSE_WINDOW_MS = 30_000;

export function refreshOnce(refreshToken: string): Promise<RefreshOutcome> {
  const now = Date.now();
  for (const [key, entry] of inflight) if (entry.expires < now) inflight.delete(key);

  const cached = inflight.get(refreshToken);
  if (cached) return cached.promise;

  const promise = callBackend<{ accessToken: string; refreshToken: string }>("/api/auth/refresh-token", jsonPost({ refreshToken }));
  inflight.set(refreshToken, { promise, expires: now + REUSE_WINDOW_MS });
  return promise;
}
