"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  endSession,
  resumeSession,
  startHeartbeat,
  startSession,
  trackPageView,
} from "@/lib/analytics-tracker";

/**
 * Mounts the storefront → backend analytics pipeline:
 *   1. Starts a session on first mount (persists visitorId in localStorage, sessionId in sessionStorage).
 *   2. Fires a page_view on every path or query change.
 *   3. Sends a heartbeat every 30s while the tab is visible.
 *   4. Flushes a session_end via sendBeacon on tab close.
 * Admin pages are deliberately excluded so dashboard activity doesn't pollute the funnel.
 */
export default function StorefrontAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const firstRender = useRef(true);

  useEffect(() => {
    if (pathname?.startsWith("/admin-dashboard")) return;

    void startSession().then(() => void trackPageView());
    const stopHeartbeat = startHeartbeat();

    const onPageHide = () => endSession();
    // Back/forward cache restore: pagehide already ended the session, so reopen it.
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) void resumeSession().then(() => void trackPageView());
    };
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      stopHeartbeat();
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
    };
    // Only on first mount — later path/query changes fire their own effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (pathname?.startsWith("/admin-dashboard")) return;
    void trackPageView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()]);

  return null;
}
