// Storefront → backend analytics ingestion. Generates a persistent visitorId (localStorage)
// and a per-tab sessionId (sessionStorage), posts session-start / page-view / events / heartbeat
// / session-end to /api/v1/analytics/*. All functions are safe to call from either server
// (no-op) or client (real work).

const VISITOR_KEY = "gsbd-visitor-id";
const SESSION_KEY = "gsbd-session-id";
const ATTR_KEY = "gsbd-first-touch"; // utm attribution cached for this session
const HEARTBEAT_MS = 30_000;

type FirstTouch = {
  referrer: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

type EventName =
  | "page_view"
  | "button_click"
  | "product_view"
  | "product_click"
  | "add_to_cart"
  | "remove_from_cart"
  | "wishlist_add"
  | "wishlist_remove"
  | "search"
  | "category_click"
  | "banner_click"
  | "filter_click"
  | "sort_click"
  | "checkout_start"
  | "payment_initiated"
  | "payment_success"
  | "payment_failed";

export interface AnalyticsEventPayload {
  eventName: EventName;
  pageUrl?: string;
  pageTitle?: string;
  productId?: string;
  elementId?: string;
  buttonLabel?: string;
  metadata?: Record<string, unknown>;
}

const isBrowser = () => typeof window !== "undefined";

const randomId = (prefix: "v" | "s") => {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${prefix}-${hex}`;
};

const safeGet = (storage: Storage | undefined, key: string) => {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
};
const safeSet = (storage: Storage | undefined, key: string, value: string) => {
  try {
    storage?.setItem(key, value);
  } catch {
    /* ignore quota / private mode errors */
  }
};

export function getVisitorId(): string | null {
  if (!isBrowser()) return null;
  let id = safeGet(window.localStorage, VISITOR_KEY);
  if (!id) {
    id = randomId("v");
    safeSet(window.localStorage, VISITOR_KEY, id);
  }
  return id;
}

export function getSessionId(): string | null {
  if (!isBrowser()) return null;
  let id = safeGet(window.sessionStorage, SESSION_KEY);
  if (!id) {
    id = randomId("s");
    safeSet(window.sessionStorage, SESSION_KEY, id);
  }
  return id;
}

function captureFirstTouch(): FirstTouch {
  if (!isBrowser()) return { referrer: "" };
  const cached = safeGet(window.sessionStorage, ATTR_KEY);
  if (cached) {
    try {
      return JSON.parse(cached) as FirstTouch;
    } catch {
      /* fall through to re-capture */
    }
  }
  const params = new URLSearchParams(window.location.search);
  const touch: FirstTouch = {
    referrer: document.referrer || "",
    utmSource: params.get("utm_source") || undefined,
    utmMedium: params.get("utm_medium") || undefined,
    utmCampaign: params.get("utm_campaign") || undefined,
  };
  safeSet(window.sessionStorage, ATTR_KEY, JSON.stringify(touch));
  return touch;
}

/**
 * Low-level POST helper. Uses navigator.sendBeacon when `beacon` is true (fire-and-forget on unload),
 * falls back to fetch otherwise. Never throws — analytics errors must not break the storefront.
 */
async function post(path: string, body: unknown, { beacon = false } = {}): Promise<void> {
  if (!isBrowser()) return;
  const url = `/api/v1/analytics/${path}`;
  try {
    if (beacon && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      return;
    }
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: beacon,
    });
  } catch {
    /* silently swallow — analytics must not break the page */
  }
}

let sessionStarted = false;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

/** Call once per page load. Idempotent within the tab — only first call hits the server. */
export async function startSession(): Promise<void> {
  if (!isBrowser() || sessionStarted) return;
  const visitorId = getVisitorId();
  const sessionId = getSessionId();
  if (!visitorId || !sessionId) return;
  sessionStarted = true;
  const touch = captureFirstTouch();
  await post("session/start", {
    visitorId,
    sessionId,
    pageUrl: window.location.href,
    referrer: touch.referrer,
    utmSource: touch.utmSource,
    utmMedium: touch.utmMedium,
    utmCampaign: touch.utmCampaign,
  });
}

/** Send a page_view event for the current URL. Call on every SPA route change. */
export async function trackPageView(pageTitle?: string): Promise<void> {
  if (!isBrowser()) return;
  const visitorId = getVisitorId();
  const sessionId = getSessionId();
  if (!visitorId || !sessionId) return;
  await post("page-view", {
    visitorId,
    sessionId,
    pageUrl: window.location.href,
    pageTitle: pageTitle ?? document.title,
    referrer: document.referrer || undefined,
  });
}

/** Fire a custom storefront event. `purchase` is intentionally not accepted — the backend reconciles it. */
export async function trackEvent(event: AnalyticsEventPayload): Promise<void> {
  if (!isBrowser()) return;
  const visitorId = getVisitorId();
  const sessionId = getSessionId();
  if (!visitorId || !sessionId) return;
  await post("events", {
    visitorId,
    sessionId,
    events: [
      {
        ...event,
        pageUrl: event.pageUrl ?? window.location.href,
        pageTitle: event.pageTitle ?? document.title,
      },
    ],
  });
}

async function heartbeat(): Promise<void> {
  if (!isBrowser() || document.hidden) return;
  const visitorId = getVisitorId();
  const sessionId = getSessionId();
  if (!visitorId || !sessionId) return;
  await post("heartbeat", { visitorId, sessionId, pageUrl: window.location.href });
}

/** Start the 30-second heartbeat timer. Returns a stop function. Safe to call multiple times. */
export function startHeartbeat(): () => void {
  if (!isBrowser()) return () => {};
  if (heartbeatTimer) return () => {};
  heartbeatTimer = setInterval(() => void heartbeat(), HEARTBEAT_MS);
  return () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };
}

/** Fired on tab close / pagehide via sendBeacon — must be synchronous. */
export function endSession(): void {
  if (!isBrowser()) return;
  const visitorId = getVisitorId();
  const sessionId = getSessionId();
  if (!visitorId || !sessionId) return;
  void post(
    "session/end",
    { visitorId, sessionId, exitPage: window.location.href },
    { beacon: true }
  );
}
