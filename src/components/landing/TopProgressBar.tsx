"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// NProgress-style top bar. Starts on ANY navigation intent (anchor click, router.push, back/forward),
// trickles forward while the next route is rendering server-side, snaps to 100% and fades out when
// pathname/search commits. Dependency-free.
function TopProgressBarInner() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const startedAtRef = useRef<number>(0);

  // Centralised "start the bar". Guarded so repeated clicks don't reset the trickle.
  const start = () => {
    startedAtRef.current = Date.now();
    setVisible(true);
    setProgress((p) => (p === 0 ? 15 : p));
  };

  // Anchor-click + explicit router.push both end up changing window.history or firing a popstate.
  // Patch pushState/replaceState so programmatic navigations show the bar too.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      } catch {
        return;
      }
      start();
    };
    document.addEventListener("click", onClick, true);

    // Catch router.push / router.replace — Next.js calls history.pushState / replaceState under the hood,
    // and that call happens inside React's useInsertionEffect phase. Scheduling a setState there is
    // forbidden ("useInsertionEffect must not schedule updates"), so we defer start() to a microtask
    // so React is out of the insertion phase by the time setVisible/setProgress run.
    const origPush = window.history.pushState.bind(window.history);
    const origReplace = window.history.replaceState.bind(window.history);
    const deferredStart = () => queueMicrotask(start);
    window.history.pushState = function (...args) {
      const nextUrl = args[2];
      if (nextUrl) {
        try {
          const u = new URL(String(nextUrl), window.location.href);
          if (u.pathname !== window.location.pathname || u.search !== window.location.search) deferredStart();
        } catch {
          /* ignore */
        }
      }
      return origPush(...args);
    };
    window.history.replaceState = function (...args) {
      const nextUrl = args[2];
      if (nextUrl) {
        try {
          const u = new URL(String(nextUrl), window.location.href);
          if (u.pathname !== window.location.pathname || u.search !== window.location.search) deferredStart();
        } catch {
          /* ignore */
        }
      }
      return origReplace(...args);
    };

    const onPop = () => start();
    window.addEventListener("popstate", onPop);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trickle while in flight so slow server renders still look alive.
  useEffect(() => {
    if (!visible) return;
    const id = window.setInterval(() => {
      setProgress((p) => (p >= 92 ? p : p + (92 - p) * 0.12));
    }, 180);
    return () => window.clearInterval(id);
  }, [visible]);

  // Set a flag on <html> while a navigation is in flight. Lets us dim the body cursor to "wait"
  // and apply any other global "navigating" styles from CSS.
  useEffect(() => {
    if (visible) document.documentElement.setAttribute("data-navigating", "true");
    else document.documentElement.removeAttribute("data-navigating");
  }, [visible]);

  // Pathname/search commit = next route arrived. Snap to 100% and fade out.
  const key = `${pathname}?${search?.toString() ?? ""}`;
  useEffect(() => {
    if (!visible) return;
    setProgress(100);
    const minShow = Math.max(0, 150 - (Date.now() - startedAtRef.current));
    const hideAt = window.setTimeout(() => setVisible(false), 250 + minShow);
    const resetAt = window.setTimeout(() => setProgress(0), 600 + minShow);
    return () => {
      window.clearTimeout(hideAt);
      window.clearTimeout(resetAt);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <>
      {/* The bar itself */}
      <div
        aria-hidden="true"
        className="fixed left-0 top-0 z-[9999] h-[3px] bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 shadow-[0_0_12px_rgba(37,99,235,0.65)] pointer-events-none"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
          transition: visible ? "width 200ms ease-out" : "opacity 300ms ease-out",
        }}
      />
      {/* Glowing "running" dot at the leading edge of the bar — makes slow server renders feel alive. */}
      {visible && progress < 100 && (
        <div
          aria-hidden="true"
          className="fixed top-0 z-[9999] h-[3px] w-[80px] pointer-events-none bg-gradient-to-r from-transparent to-white/80 blur-[1px]"
          style={{
            left: `calc(${progress}% - 80px)`,
            transition: "left 200ms ease-out",
          }}
        />
      )}
    </>
  );
}

export default function TopProgressBar() {
  return (
    <Suspense fallback={null}>
      <TopProgressBarInner />
    </Suspense>
  );
}
